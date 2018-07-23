/**
 * Created by nazarigonzalez on 13/10/16.
 */

package game

import (
	"math"
	"math/rand"
	"sort"
	"sync"

	"github.com/nazariglez/go-loop"
	"gopkg.in/nazariglez/go-easing.v0"
	"gopkg.in/nazariglez/go-rbush.v0"

	"../logger"
	"../utils"
	"fmt"
	"runtime"
	"time"
)

const (
	PLAYER_LIMIT          = 90
	UPDATE_FPS            = 40
	MAP_SIZE              = 13000
	SEND_LEADERBOARD_TIME = 3
	SEND_RADAR_TIME       = 15
	MAX_IDS_TO_ASSIGN     = 10000

	minActorScreenSize = 55
	maxActorScreenSize = 280

	powerUpBotPercent    = 0.1
	powerUpPlayerPercent = 0.17

	powerUpCrazyProbability  = 0.3
	powerUpPepperProbability = 0.6
	powerUpMulti2Probability = 0.09
	powerUpMulti3Probability = 0.01

	massDrainedInCrazyMode = 0.03
	medicineSearchTime     = 1.5
	medicineNum            = 10

	processBrainPerFrame = 3
)

const (
	GAME_EVENT_UPDATE = iota
	GAME_EVENT_ADD_PLAYER
	GAME_EVENT_REMOVE_PLAYER
)

var (
	MAX_BOTS = 90 //PLAYER_LIMIT //* 70 / 100
	MAX_FOOD = MAX_BOTS + (MAP_SIZE * 6 / 100)

	viewPortEasing = easing.OutExpo() //todo find a better easing

	updateWarningsMilliseconds = float64(1000 / UPDATE_FPS)
)

type GameEvent struct {
	Id   int
	Data interface{}
}

type Game struct {
	sync.Mutex

	Id    int
	GChan chan *GameEvent

	players            []*WSConnection
	entities           []interface{}
	entitiesIndex      int
	entitiesKilled     []*map[int]int
	actors             ActorSlice
	foods              []*Food
	powerUps           []*PowerUp
	fartShoots         []*FartShoot
	medicines          []*Medicine
	botsToIA           []*Actor
	playersToUpdate    []*WSConnection
	addPlayersQueue    []*WSConnection
	removePlayersQueue []*WSConnection

	rbush   *rbush.RBush
	rbBoxes []rbush.Box

	size, foodCount, botsCount int
	loop                       *loop.Loop
	time, sendLeaderboardTime  float64
	sendRadarTime              float64

	actorsToKill     []*Actor
	foodsToKill      []*Food
	powerUpsToKill   []*PowerUp
	fartShootsToKill []*FartShoot

	pool             *EntitiyPool
	leaderboardNames []string

	//debug
	updateDelay      float64
	iaDelay          float64
	worldDelay       float64
	leaderboardDelay float64
	radarDelay       float64

	warningNum  int
	warningTime time.Time
}

func NewGame(id int) *Game {
	r := rbush.NewRBush(9)
	l := loop.NewLoop(UPDATE_FPS)

	game := &Game{
		GChan: make(chan *GameEvent, 2000),

		Id: id,

		players:  []*WSConnection{},
		entities: []interface{}{},
		entitiesKilled: []*map[int]int{
			&map[int]int{},
			&map[int]int{},
		},
		medicines: make([]*Medicine, medicineNum),

		rbush: &r,
		loop:  &l,
		size:  MAP_SIZE,

		pool:             GetEntityPool(),
		leaderboardNames: make([]string, 10),
	}

	//don't use the first slot
	game.entities = append(game.entities, nil)

	for i := 0; i < MAX_BOTS; i++ {
		game.spawnBot()
	}

	for i := 0; i < MAX_FOOD; i++ {
		game.spawnFood(0, 0, 0)
	}

	go game.ReadEvents()
	return game
}

func (g *Game) tickLoop(delta float64) {
	g.AddEvent(GAME_EVENT_UPDATE, delta)
}

func (g *Game) ReadEvents() {
	g.loop.Tick = g.tickLoop

	for evt := range g.GChan {
		switch evt.Id {
		case GAME_EVENT_UPDATE:
			g.Update(evt.Data.(float64))
			g.checkRoomStatus()
		case GAME_EVENT_ADD_PLAYER:
			//g.AddPlayer(evt.Data.(*WSConnection))
			g.addPlayersQueue = append(g.addPlayersQueue, evt.Data.(*WSConnection))
			//logger.Debugf("Queue player to add to the game.")
			if !g.loop.IsRunning() {
				g.Start()
			}
			//CoreConnection.SendCoreUpdate()
		case GAME_EVENT_REMOVE_PLAYER:
			//g.RemovePlayer(evt.Data.(*WSConnection))
			g.removePlayersQueue = append(g.removePlayersQueue, evt.Data.(*WSConnection))
			//logger.Debugf("Queue player to remove from the game.")
			//CoreConnection.SendCoreUpdate()
		}
	}
}

func (g *Game) AddEvent(event int, data interface{}) {
	g.GChan <- &GameEvent{
		Id:   event,
		Data: data,
	}
}

func (g *Game) handlePlayersState() bool {
	playerChanges := false
	if len(g.addPlayersQueue) > 0 {
		player := g.addPlayersQueue[0]
		g.addPlayersQueue[0] = nil
		g.addPlayersQueue = g.addPlayersQueue[1:]

		g.AddPlayer(player)
		playerChanges = true
	}

	if len(g.removePlayersQueue) > 0 {
		player := g.removePlayersQueue[0]
		g.removePlayersQueue[0] = nil
		g.removePlayersQueue = g.removePlayersQueue[1:]

		g.RemovePlayer(player)
		playerChanges = true
	}

	return playerChanges
}

func (g *Game) Update(delta float64) {
	now := time.Now()
	g.time += delta
	size := float64(g.size / 2) //todo move g.size to float?

	playerChanges := g.handlePlayersState()

	g.rbBoxes = []rbush.Box{}
	g.rbush.Clear()

	addPlayersToUpdate := false
	if len(g.playersToUpdate) == 0 {
		addPlayersToUpdate = true
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		for _, ws := range g.players {
			if ws != nil {
				ws.Time += delta
				if addPlayersToUpdate {
					g.playersToUpdate = append(g.playersToUpdate, ws)
				}
			}
		}

		wg.Done()
	}()

	iaAddBots := false
	if len(g.botsToIA) == 0 {
		iaAddBots = true
	}

	var botsToUpdate []*Actor
	aLen := len(g.actors)
	block := 1
	limit := aLen
	cpus := runtime.NumCPU()
	if aLen > cpus {
		block = cpus
		limit = aLen / block
	}

	for n := 0; n < block; n++ {
		wg.Add(1)

		start := n * limit
		end := start + limit

		if n == block-1 {
			end += aLen % cpus
		}

		go func(s, e int) {
			for i := s; i < e; i++ {
				a := g.actors[i]
				a.Lock()
				a.Update(delta)
				a.FixPosition(delta, size, size)
				a.UpdateBox()
				bbox := *a.Box
				isBot := a.IsBot()
				ia := a.IA
				a.Unlock()

				if isBot && ia {
					g.Lock()
					if iaAddBots {
						g.botsToIA = append(g.botsToIA, a)
					}
					botsToUpdate = append(botsToUpdate, a)
					g.Unlock()
				}

				g.Lock()
				g.rbBoxes = append(g.rbBoxes, bbox)
				g.Unlock()
			}
			wg.Done()
		}(start, end)
	}

	wg.Wait()

	//update botsIA between frames
	for i := 0; i < len(botsToUpdate); i++ {
		if botsToUpdate[i] != nil {
			botsToUpdate[i].UpdateIA(delta)
		}
	}

	fLen := len(g.foods)
	block = 1
	limit = fLen
	if fLen > cpus {
		block = cpus
		limit = fLen / block
	}

	for n := 0; n < block; n++ {
		wg.Add(1)
		start := n * limit
		end := start + limit

		if n == block-1 {
			end += fLen % cpus
		}

		go func(s, e int) {
			for i := s; i < e; i++ {
				f := g.foods[i]
				f.Update(delta)
				f.FixPosition(delta, size, size)
				f.UpdateBox()

				g.Lock()
				g.rbBoxes = append(g.rbBoxes, *f.Box)
				g.Unlock()
			}
			wg.Done()
		}(start, end)
	}

	/*wg.Add(1)
	go func() {
		llen := len(g.foods)
		for i := 0; i < llen; i++ {
			f := g.foods[i]
			f.Update(delta)
			f.FixPosition(delta, size, size)
			f.UpdateBox()

			g.Lock()
			g.rbBoxes = append(g.rbBoxes, *f.Box)
			g.Unlock()
		}

		wg.Done()
	}()*/

	wg.Add(1)
	go func() {
		llen := len(g.powerUps)
		for i := 0; i < llen; i++ {
			c := g.powerUps[i]
			c.Update(delta)
			c.FixPosition(delta, size, size)
			c.UpdateBox()

			g.Lock()
			g.rbBoxes = append(g.rbBoxes, *c.Box)
			g.Unlock()
		}

		wg.Done()
	}()

	wg.Add(1)
	go func() {
		llen := len(g.fartShoots)
		for i := 0; i < llen; i++ {
			f := g.fartShoots[i]
			f.Update(delta)
			f.UpdateBox()

			g.Lock()
			g.rbBoxes = append(g.rbBoxes, *f.Box)
			g.Unlock()
		}

		wg.Done()
	}()

	wg.Add(1)
	go func() {
		llen := len(g.medicines)
		for i := 0; i < llen; i++ {
			if g.medicines[i] == nil {
				g.spawnMedicine(i)
			}

			m := g.medicines[i]
			m.Update(delta)

			if m.State != STATE_ALIVE {
				if m.TimeToRespawn <= 0 {
					g.spawnMedicine(i)
				}
				continue
			}

			m.FixPosition(delta, size, size)
			m.UpdateBox()

			g.Lock()
			g.rbBoxes = append(g.rbBoxes, *m.Box)
			g.Unlock()
		}
		wg.Done()
	}()

	wg.Wait()

	g.rbush.Load(g.rbBoxes)
	g.manageCollisions(delta)
	g.medicineSearchTarget(delta)
	g.runBotIA()

	g.cleanWorld()

	g.sendWorldUpdate(delta)
	g.sendLeaderboardUpdate(delta)
	g.sendRadarFood(delta)

	//update duration
	g.updateDelay = time.Since(now).Seconds() * 1000

	if playerChanges {
		CoreConnection.SendCoreUpdate()
		if len(g.players) == 0 {
			g.Stop()
		}
	}
}

func (g *Game) checkRoomStatus() {
	if g.updateDelay > updateWarningsMilliseconds {
		g.warningNum++
		if g.warningNum == UPDATE_FPS/2 && time.Since(g.warningTime).Seconds() < 1 {
			msg := fmt.Sprintf(`
			 Warning Server Slow [%s]
			 - Room: %d
			 - Players: %d
			 - Bots: %d
			 - Foods: %d
			 - Game Time: %d
			 - Update Time: %f
			 - World Time: %f
			 - IA Time: %f
			 - Leaderboard Time: %f
			 - Radar Time: %f
			`,
				SERVER_ID,
				g.Id,
				len(g.players),
				g.botsCount,
				g.foodCount,
				int(g.time),
				g.updateDelay,
				g.worldDelay,
				g.iaDelay,
				g.leaderboardDelay,
				g.radarDelay,
			)
			g.warningNum = 0

			CoreConnection.SendCoreWarning(msg)
		} else {
			g.warningTime = time.Now()
		}
	} else {
		g.warningNum = 0
	}

}

func (g *Game) runBotIA() {
	now := time.Now()
	var wg sync.WaitGroup

	bots := 0
	for len(g.botsToIA) != 0 {
		a := g.botsToIA[0]
		if a != nil && a.State == STATE_ALIVE && a.IA && a.Brain.Time <= 0 {
			bots++
			wg.Add(1)
			go g.processIA(a, &wg)
		}

		g.botsToIA[0] = nil
		g.botsToIA = g.botsToIA[1:]

		if bots == processBrainPerFrame {
			break
		}
	}

	wg.Wait()
	g.iaDelay = time.Since(now).Seconds() * 1000
}

func (g *Game) processIA(a *Actor, wg *sync.WaitGroup) {
	rnd := rand.Float64()
	box := &rbush.Box{
		MinX: a.Box.MinX - a.Radius - 600,
		MinY: a.Box.MinY - a.Radius - 600,
		MaxX: a.Box.MaxX + a.Radius + 600,
		MaxY: a.Box.MaxY + a.Radius + 600,
	}

	var entity interface{}
	var f *Food
	var aSmall *Actor
	var aBig *Actor
	var m *Medicine
	var isNoob bool

	collisions := g.rbush.Search(box)
	llen := len(collisions)

	//If no player near, just scavenger
	playerNear := false

	//todo, fire pepperfart, avoid followe actors loading pepperfarts

	for i := 0; i < llen; i++ {
		entity = g.entities[collisions[i].Data.(int)]
		switch e := entity.(type) {
		case *Food:
			if f == nil {
				f = e
			} else if f.Mass < e.Mass || a.Position.Distance(e.Position) < a.Position.Distance(f.Position) {
				f = e
			}

		case *Actor:
			//avoid kill noob players
			isNoob = (!e.IsBot() && e.Mass < 100 && e.GetPlayerTime() < 40) && rand.Float64() < 0.8

			if !isNoob && aSmall == nil && e.Mass < a.Mass && a.Mass-e.Mass > SafeMarginMass(a.Mass) {
				aSmall = e
			} else if !isNoob && aSmall != nil && e.Mass < a.Mass && aSmall.Mass > e.Mass && a.Mass-e.Mass > SafeMarginMass(a.Mass) && a.Position.Distance(e.Position) < a.Position.Distance(aSmall.Position) {
				aSmall = e
			}

			if aBig == nil && e.Mass > a.Mass && e.Mass-a.Mass > SafeMarginMass(e.Mass) {
				aBig = e
			} else if aBig != nil && e.Mass > a.Mass && aBig.Mass < e.Mass && e.Mass-a.Mass > SafeMarginMass(e.Mass) && a.Position.Distance(e.Position) < a.Position.Distance(aBig.Position) {
				aBig = e
			}

			if !e.IsBot() {
				playerNear = true
			}

		case *Medicine:
			if m == nil {
				m = e
			} else if a.Position.Distance(e.Position) < a.Position.Distance(m.Position) {
				m = e
			}

		}
	}

	a.SetFast(false)
	r := a.Radius * 2
	if a.Brain.Type == BRAIN_TYPE_NORMAL && playerNear {

		if m != nil && !a.Crazy && m.Target != nil && m.Target == a {
			//run away from medicine finding the actor
			a.Brain.Target = nil
			a.Brain.State = BRAIN_STATE_MEDICINE
			a.SetForce(10)
			a.SetAngle(-(a.Position.Angle(m.Position) + (-45+rand.Float64()*90)*utils.DEG_TO_RAD))
			a.Brain.Time = 0.5

			if rand.Float64() < 0.6 {
				a.SetFast(true)
			}

		} else if m != nil && !a.Crazy && a.Position.Distance(m.Position)-a.Radius < r+50 {
			//run away from near medicines
			a.Brain.Target = nil
			a.Brain.State = BRAIN_STATE_MEDICINE
			a.SetForce(5 + rand.Float64()*5)
			a.SetAngle(-(a.Position.Angle(m.Position) + (-90+rand.Float64()*180)*utils.DEG_TO_RAD))
			a.Brain.Time = 0.5
		} else if a.Crazy && aBig != nil && !aBig.Crazy && a.CrazyTime > 0.75 {
			//Go to big actors to leach mass
			a.Brain.Target = aBig
			a.Brain.State = BRAIN_STATE_KILLING
			a.SetForce(10)
			a.SetAngle(a.Position.Angle(aBig.Position))
			a.Brain.Time = 2.5
		} else if a.Brain.Target != nil && aSmall != nil && !aSmall.Crazy && (aSmall.Mass > a.Brain.Target.Mass || rnd < 0.05) {
			//kill small actors
			a.Brain.Target = aSmall
			a.Brain.State = BRAIN_STATE_KILLING
			a.SetForce(10)
			a.SetAngle(a.Position.Angle(aSmall.Position))
			a.Brain.Time = 2

			if rand.Float64() < 0.75 {
				a.SetFast(true)
			}

			if a.Mass > 31 && rand.Float64() < 0.3 {
				a.SetFire(true)
			}

		} else if a.Brain.Target == nil && aSmall != nil && aBig != nil {
			if (!aSmall.IsBot() && aBig.IsBot() && !aSmall.Crazy) || (a.Position.Distance(aSmall.Position) < a.Position.Distance(aBig.Position)) {
				//kill small actors
				a.Brain.Target = aSmall
				a.Brain.State = BRAIN_STATE_KILLING
				a.SetForce(10)
				a.SetAngle(a.Position.Angle(aSmall.Position))
				a.Brain.Time = 2

				if rand.Float64() < 0.75 {
					a.SetFast(true)
				}

				if a.Mass > 31 && rand.Float64() < 0.3 {
					a.SetFire(true)
				}

			} else {
				//run away from big actors
				a.Brain.Target = aBig
				a.Brain.State = BRAIN_STATE_RUN_AWAY
				a.SetForce(10)
				a.SetAngle(-(a.Position.Angle(aBig.Position) + (-90+rand.Float64()*180)*utils.DEG_TO_RAD))
				a.Brain.Time = 1.5

				a.SetFast(true)

				if a.Mass > 31 && rand.Float64() < 0.3 {
					a.SetAngle(a.Position.Angle(aBig.Position))
					a.SetFire(true)
				} else if a.Peppers > 0 && rand.Float64() < 0.09 {
					a.SetFirePepper(true)
				}

			}
		} else if a.Brain.Target == nil && ((aSmall != nil && !aSmall.Crazy) || aBig != nil) {
			if aSmall != nil {
				//kill small actors
				a.Brain.Target = aSmall
				a.Brain.State = BRAIN_STATE_KILLING
				a.SetForce(10)
				a.SetAngle(a.Position.Angle(aSmall.Position))
				a.Brain.Time = 2

				if rand.Float64() < 0.75 {
					a.SetFast(true)
				}

				if a.Mass > 31 && rand.Float64() < 0.3 {
					a.SetFire(true)
				}

			} else {
				//run away from big actors
				a.Brain.Target = aBig
				a.Brain.State = BRAIN_STATE_RUN_AWAY
				a.SetForce(10)
				//a.SetFast(true)
				a.SetAngle(-(a.Position.Angle(aBig.Position) + (-90+rand.Float64()*180)*utils.DEG_TO_RAD))
				a.Brain.Time = 1.5

				a.SetFast(true)

				if a.Mass > 31 && rand.Float64() < 0.2 {
					a.SetAngle(a.Position.Angle(aBig.Position))
					a.SetFire(true)
				} else if a.Peppers > 0 && rand.Float64() < 0.09 {
					a.SetFirePepper(true)
				}
			}
		} else if f != nil {
			//eat food
			a.Brain.Time = 0.5
			a.Brain.Target = nil
			a.Brain.State = BRAIN_STATE_SEARCH_FOOD
			a.SetForce(4 + rand.Float64()*6)
			a.SetAngle(a.Position.Angle(f.Position))

			if rand.Float64() < 0.1 {
				a.SetFast(true)
			}
		}

		if a.Brain.Target != nil && (a.Brain.Target.Crazy || a.Brain.Target.State == STATE_DEAD) {
			a.Brain.Time = 0.5
			a.Brain.Target = nil
			a.Brain.State = BRAIN_STATE_SEARCH_FOOD
			if f != nil {
				a.SetForce(4 + rand.Float64()*6)
				a.SetAngle(a.Position.Angle(f.Position))

				if rand.Float64() < 0.1 {
					a.SetFast(true)
				}
			}
		}

	} else if a.Brain.Type == BRAIN_TYPE_SCAVENGER || !playerNear {

		a.Brain.Target = nil
		a.Brain.State = BRAIN_STATE_SEARCH_FOOD

		if m != nil && !a.Crazy && m.Target != nil && m.Target == a {
			//run away from medicine finding the actor
			a.SetForce(10)
			a.SetAngle(-(a.Position.Angle(m.Position) + (-45+rand.Float64()*90)*utils.DEG_TO_RAD))
			a.Brain.Time = 0.5

			if rand.Float64() < 0.6 {
				a.SetFast(true)
			}
		} else if f != nil {
			a.SetForce(10)
			a.SetAngle(a.Position.Angle(f.Position))

			if rand.Float64() < 0.2 {
				a.SetFast(true)
			}
		}

	}

	wg.Done()
}

func (g *Game) manageCollisions(delta float64) {
	llen := len(g.actors)
	for i := 0; i < llen; i++ {
		a1 := g.actors[i]

		if a1 == nil || a1.State != STATE_ALIVE {
			continue
		}

		collisions := g.rbush.Search(a1.Box)
		for n := 0; n < len(collisions); n++ {
			a2ID := collisions[n].Data.(int)

			if a2ID == a1.Id {
				continue
			}

			switch e := g.entities[a2ID].(type) {
			case *Actor:

				if (e.State != STATE_ALIVE) || (a1.Crazy && e.Crazy) {
					continue
				}

				var accuracy = 0.0
				if (a1.Crazy && a1.Mass < e.Mass) || (e.Crazy && e.Mass < a1.Mass) {
					accuracy = 50
				} else {
					accuracy = -30
				}

				if !g.existsCollisionBetween(a1.Radius, e.Radius, a1.Position, e.Position, accuracy) {
					continue
				}

				//exists collision
				if a1.Crazy && a1.Mass < e.Mass {
					g.actorDrainMass(a1, e, delta)
				} else if e.Crazy && e.Mass < a1.Mass {
					g.actorDrainMass(e, a1, delta)
				} else {
					diff := a1.Mass - e.Mass
					var killed, assasin *Actor
					if a1.Mass > e.Mass {
						killed = e
						assasin = a1
					} else {
						killed = a1
						assasin = e
					}
					safeMargin := SafeMarginMass(assasin.Mass)

					if diff < -safeMargin || diff > safeMargin {
						g.killActorBy(killed, assasin)
					}
				}

			case *Food:
				if e.State != STATE_ALIVE {
					continue
				}

				if !g.existsCollisionBetween(a1.Radius, e.Radius, a1.Position, e.Position, 130) {
					continue
				}

				g.actorEatFood(a1, e)

			case *PowerUp:
				if e.State != STATE_ALIVE {
					continue
				}

				if e.PowerType == POWER_UP_CRAZY && (a1.Crazy || !a1.CanBeCrazy()) {
					continue
				}

				if (e.PowerType == POWER_UP_MULTI2 || e.PowerType == POWER_UP_MULTI3) && a1.Multi != 1 {
					continue
				}

				if !g.existsCollisionBetween(a1.Radius, e.Radius, a1.Position, e.Position, 80) {
					continue
				}

				g.actorEatPowerUp(a1, e)

			case *FartShoot:
				if e.State != STATE_ALIVE || e.IsSafeFor(a1) {
					continue
				}

				if e.Type == FART_TYPE_PEPPER && a1.Burning {
					continue
				}

				if !g.existsCollisionBetween(a1.Radius, e.Radius, a1.Position, e.Position, 50) {
					continue
				}

				g.actorHitFartShoot(a1, e)

			case *Medicine:
				if e.State != STATE_ALIVE || a1.Crazy {
					continue
				}

				if !g.existsCollisionBetween(a1.Radius, e.Radius, a1.Position, e.Position, -50) {
					continue
				}

				g.actorEatMedicine(a1, e)

			}

		}

	}
}

func (g *Game) saveEntityKilled(a, b int) {
	(*g.entitiesKilled[0])[a] = b
	(*g.entitiesKilled[1])[a] = b
}

func (g *Game) actorHitFartShoot(a *Actor, f *FartShoot) {
	//g.entitiesKilled[f.Id] = a.Id
	g.saveEntityKilled(f.Id, a.Id)

	if f.Type == FART_TYPE_NORMAL {
		a.Lock()
		a.SetSlow(true)
		a.SetMass(a.Mass + f.Mass)
		if a.Stats() != nil {
			a.Stats().IncrementFartsTaken(1)
		}
		a.Unlock()
	} else if f.Type == FART_TYPE_PEPPER {
		a.Lock()
		a.SetBurning(true)
		a.SetSlow(true)
		if a.Stats() != nil {
			a.Stats().IncrementFireFartsTaken(1)
		}
		a.Unlock()
	}

	f.State = STATE_DEAD

	g.fartShootsToKill = append(g.fartShootsToKill, f)
}

func (g *Game) actorDrainMass(vampire, victim *Actor, delta float64) {
	if victim.Mass > 0 {
		drainedMass := math.Ceil(victim.Mass * massDrainedInCrazyMode * delta)

		vampire.Lock()
		vampire.SetMass(vampire.Mass + drainedMass)
		vampire.CrazyTime -= 0.001 * drainedMass
		vampire.Unlock()

		victim.Lock()
		victim.SetMass(victim.Mass - drainedMass)

		if victim.Stats() != nil {
			victim.Stats().IncrementMassLostByStar(drainedMass)
		}

		if victim.Mass < 0 {
			victim.SetMass(0)
		}
		victim.Unlock()

	}
}

func (g *Game) actorEatFood(a *Actor, f *Food) {
	//g.entitiesKilled[f.Id] = a.Id
	g.saveEntityKilled(f.Id, a.Id)

	a.Lock()
	if a.IsBot() && a.Multi == 1 {
		a.SetMass(a.Mass + f.Mass*a.Multi*1.8)
	} else {
		a.SetMass(a.Mass + f.Mass*a.Multi)
		if a.Stats() != nil {
			a.Stats().IncrementFoodEaten(1)
		}
	}
	a.Unlock()

	f.State = STATE_DEAD

	g.foodCount--
	g.foodsToKill = append(g.foodsToKill, f)

	if len(g.foods) < MAX_FOOD {
		g.spawnFood(0, 0, 0)
	}
}

func (g *Game) actorEatMedicine(a *Actor, m *Medicine) {
	//g.entitiesKilled[m.Id] = a.Id
	g.saveEntityKilled(m.Id, a.Id)
	m.Die()

	totalMass := (0.35 + rand.Float64()*0.20) * a.Mass
	n := a.GetGeneratedFoodNum(true)
	mass := math.Max(math.Ceil(totalMass/n), 2)
	for i := 0.0; i < n; i++ {
		f := g.spawnFood(a.Position.X, a.Position.Y, mass)
		f.SetMovement(rand.Float64()*rad, 160+rand.Float64()*460)
	}

	if a.Stats() != nil {
		a.Stats().SetDeathBy(DeathByMedicine)
	}

	g.killActor(a)
	g.removeEntity(m.Id)
}

func (g *Game) medicineSearchTarget(delta float64) {
	size := float64(g.size) * (medicineSearchDistance / 2) * 2

	for i := 0; i < medicineNum; i++ {
		if g.medicines[i] == nil {
			g.spawnMedicine(i)
		}

		if g.medicines[i].State != STATE_ALIVE {
			continue
		}

		g.medicines[i].SearchTime -= delta
		if g.medicines[i].SearchTime > 0 {
			continue
		}

		m := g.medicines[i]
		xx1 := m.Position.X - size/2
		yy1 := m.Position.Y - size/2

		var a, target *Actor
		rnd := rand.Float64()

		for i := 0; i < len(g.actors); i++ {
			a = g.actors[i]

			if a.State == STATE_DEAD {
				continue
			}

			if a.FindingByMedicine != -1 && m.Target != a {
				continue
			}

			if !g.existsRectCollision(xx1, yy1, size, size, a) {
				continue
			}

			if !(!a.IsBot() || a.IsBot() && rnd < 0.75) {
				continue
			}

			if !m.IsBestTarget(a) {
				continue
			}

			if target == nil {
				target = a
			} else if a.Mass > target.Mass {
				target = a
			}
		}

		if target != nil && m.Target != target {
			m.SetTarget(target)
			m.SearchTime = medicineSearchTime * 5
		} else {
			m.SearchTime = medicineSearchTime
		}

	}

}

func (g *Game) killActorBy(killed, assasin *Actor) {
	//g.entitiesKilled[killed.Id] = assasin.Id
	g.saveEntityKilled(killed.Id, assasin.Id)

	angle := math.Atan2(killed.Position.Y-assasin.Position.Y, killed.Position.X-assasin.Position.X)
	totalMass := (0.25 + rand.Float64()*0.15) * killed.Mass
	n := killed.GetGeneratedFoodNum(false)
	mass := math.Max(math.Ceil(totalMass/n), 2)
	cosX := math.Cos(angle)
	sinY := math.Sin(angle)
	speedRadius := assasin.Radius * 0.9
	xx := assasin.Position.X + speedRadius*cosX
	yy := assasin.Position.Y + speedRadius*sinY

	var food *Food
	for i := 0.0; i < n; i++ {
		food = g.spawnFood(xx, yy, mass)
		food.SetMovement(angle, 200.0+rand.Float64()*600.0)
	}

	rnd := rand.Float64()
	if (killed.IsBot() && rnd < powerUpBotPercent) || (!killed.IsBot() && rnd < powerUpPlayerPercent) {
		c := g.pool.AllocPowerUp()
		c.Initialize(g.getUniqueID(), angle, 550, g.resolvePowerUpType())
		c.Position.Copy(killed.Position)
		g.powerUps = append(g.powerUps, c)
		g.addEntity(c.Id, c)
	}

	if assasin.Stats() != nil {
		if killed.IsBot() {
			assasin.Stats().IncrementBotsKilled(1)
		} else {
			assasin.Stats().IncrementPlayersKilled(1)
		}

		if killed.Mass > assasin.Stats().MaxMassKilled() {
			assasin.Stats().SetMaxMassKilled(killed.Mass)
		}
	}

	if killed.Stats() != nil {
		if assasin.IsBot() {
			killed.Stats().SetDeathBy(DeathByBot)
		} else {
			killed.Stats().SetDeathBy(DeathByPlayer)
			killed.Stats().SetKillerUser(assasin.Conn.ClientData.User)
		}

		killed.Stats().SetKillerName(assasin.Name)
	}

	g.killActor(killed)
}

func (g *Game) resolvePowerUpType() PowerType {
	rnd := rand.Float64()
	prob := 0.0

	defined := false

	var t PowerType
	for i := 0; i < 4; i++ {
		switch i {
		case 0:
			prob += powerUpCrazyProbability
			if rnd <= prob {
				t = POWER_UP_CRAZY
				defined = true
			}
		case 1:
			prob += powerUpPepperProbability
			if rnd <= prob {
				t = POWER_UP_PEPPER
				defined = true
			}
		case 2:
			prob += powerUpMulti2Probability
			if rnd <= prob {
				t = POWER_UP_MULTI2
				defined = true
			}
		case 3:
			prob += powerUpMulti3Probability
			if rnd <= prob {
				t = POWER_UP_MULTI3
				defined = true
			}
		}

		if defined {
			break
		}
	}

	return t
}

func (g *Game) actorEatPowerUp(a *Actor, c *PowerUp) {
	//g.entitiesKilled[c.Id] = a.Id
	g.saveEntityKilled(c.Id, a.Id)

	switch c.PowerType {
	case POWER_UP_CRAZY:
		a.Lock()
		a.SetCrazy(true)
		a.SetMass(a.Mass + 10 + a.Mass*0.02)
		if a.Stats() != nil {
			a.Stats().IncrementPowerUpStar(1)
		}
		a.Unlock()
	case POWER_UP_PEPPER:
		a.Lock()
		a.Peppers += 1
		if a.Stats() != nil {
			a.Stats().IncrementPowerUpPepper(1)
		}
		a.Unlock()
	case POWER_UP_MULTI2:
		a.Lock()
		a.SetMulti(2)
		if a.Stats() != nil {
			a.Stats().IncrementPowerUpMulti(1)
		}
		a.Unlock()
	case POWER_UP_MULTI3:
		a.Lock()
		a.SetMulti(3)
		if a.Stats() != nil {
			a.Stats().IncrementPowerUpMulti(1)
		}
		a.Unlock()
	}

	c.State = STATE_DEAD
	g.powerUpsToKill = append(g.powerUpsToKill, c)
}

func (g *Game) sendWorldUpdate(d float64) {
	now := time.Now()
	llen := len(g.playersToUpdate)

	if llen > 0 {
		var limit int
		if llen == 1 {
			limit = 1
		} else {
			limit = int(math.Ceil(float64(len(g.players)) / 2))
		}

		//logger.Debugf("Sending world update to (%d/%d/%d)", limit, llen, len(g.players))

		var wg sync.WaitGroup

		updates := 0
		for len(g.playersToUpdate) != 0 {
			ws := g.playersToUpdate[0]

			wg.Add(1)
			go func(ws *WSConnection) {
				if ws != nil && ws.Actor != nil {
					info := g.getActorUpdateInfo(ws.Actor)
					go ws.SendUpdate(info, ws.Time)
				}
				wg.Done()
			}(ws)

			g.playersToUpdate[0] = nil
			g.playersToUpdate = g.playersToUpdate[1:]

			updates++

			if updates == limit {
				break
			}
		}

		wg.Wait()
	}

	if len(g.players) == 1 {
		g.entitiesKilled[0] = &map[int]int{}
		g.entitiesKilled[1] = &map[int]int{}
	} else {
		g.entitiesKilled[0] = g.entitiesKilled[1]
		g.entitiesKilled[1] = &map[int]int{}
	}

	g.worldDelay = time.Since(now).Seconds() * 1000
}

func (g *Game) sendRadarFood(d float64) {
	now := time.Now()
	g.sendRadarTime += d
	if g.sendRadarTime >= SEND_RADAR_TIME {
		if len(g.players) > 0 {
			logger.Debug("Send radar food to clients")

			l := len(g.foods)
			buff := []byte{
				byte(l >> 8 & 0xff),
				byte(l >> 0 & 0xff),
			}

			for i := 0; i < l; i++ {
				x := int(g.foods[i].Position.X)
				y := int(g.foods[i].Position.Y)

				buff = append(
					buff,

					byte(x>>8&0xff),
					byte(x>>0&0xff),

					byte(y>>8&0xff),
					byte(y>>0&0xff),
				)

			}

			llen := len(g.players)
			for i := 0; i < llen; i++ {
				if g.players[i] != nil && g.players[i].Actor != nil && g.players[i].Actor.State == STATE_ALIVE {
					g.players[i].SendRadar(buff)
				}
			}
		}

		g.sendRadarTime = 0
	}
	g.radarDelay = time.Since(now).Seconds() * 1000
}

func (g *Game) sendLeaderboardUpdate(d float64) {
	now := time.Now()
	g.sendLeaderboardTime += d
	if g.sendLeaderboardTime >= SEND_LEADERBOARD_TIME {
		if len(g.players) > 0 {
			logger.Debug("Send leaderboard to clients", len(g.players))
			sort.Sort(g.actors)

			buff := []byte{}
			for i := 0; i < len(g.leaderboardNames); i++ {
				if g.leaderboardNames[i] != g.actors[i].Name {
					g.leaderboardNames[i] = g.actors[i].Name
				}

				buff = append(buff, byte(i))
				buff = append(buff, g.actors[i].BuffName...)
			}

			llen := len(g.players)
			for i := 0; i < llen; i++ {
				if g.players[i] != nil && g.players[i].Actor != nil && g.players[i].Actor.State == STATE_ALIVE {
					index := g.indexOfActor(g.players[i].Actor) + 1
					g.players[i].SendLeaderboard(buff, index)
				}
			}
		}

		g.sendLeaderboardTime = 0
	}

	g.leaderboardDelay = time.Since(now).Seconds() * 1000
}

func (g *Game) getActorUpdateInfo(a *Actor) []byte {
	var buff []byte

	a.Lock()
	cache := a.Conn.Cache
	radius := a.Radius
	a.Unlock()

	minPortWidth := 800 + radius
	maxActorWidth := 600.0 * 2
	aSize := easing.Interpolate(minActorScreenSize, maxActorScreenSize, maxActorWidth, radius*2, viewPortEasing)
	portWidth := (minPortWidth / (maxActorScreenSize - minActorScreenSize)) * aSize

	collisions := g.rbush.Search(&rbush.Box{
		MinX: a.Position.X - portWidth,
		MinY: a.Position.Y - portWidth,
		MaxX: a.Position.X + portWidth,
		MaxY: a.Position.Y + portWidth,
	})

	llen := len(collisions)
	var entity interface{}
	var ad ActorData
	var adns ActorDataNoSkin
	var fd FoodData
	var cd PowerUpData
	var fsd FartShootData
	var md MedicineData

	//wildcard to compare interfaces
	var wc interface{}

	ids := map[int]bool{}
	for i := 0; i < llen; i++ {
		entity = g.entities[collisions[i].Data.(int)]
		if entity != nil {

			switch e := entity.(type) {
			case *Actor:
				g.Lock()
				e.Lock()
				ad = e.ToData().Copy()
				e.Unlock()
				g.Unlock()

				//needs a struct without complex objects to compare as interface
				adns = ad.ToNoSkin()
				ids[adns.Id] = true

				if _, ok := cache[adns.Id]; ok {
					//update block
					if wc = adns; wc != cache[adns.Id] {
						buff = append(buff, byte(ENTITY_TYPE_ACTOR), UPDATE_CODE_UPDATE)
						buff = append(buff, ad.GetUpdateBuffer()...)

						cache[adns.Id] = adns
					}
				} else {
					//create block
					buff = append(buff, byte(ENTITY_TYPE_ACTOR), UPDATE_CODE_CREATE)
					buff = append(buff, ad.GetCreateBuffer()...)

					cache[adns.Id] = adns
				}

			case *Food:
				g.Lock()
				fd = e.ToData().Copy()
				g.Unlock()
				ids[fd.Id] = true

				if _, ok := cache[fd.Id]; ok {
					//update block
					if wc = fd; wc != cache[fd.Id] {
						buff = append(buff, byte(ENTITY_TYPE_FOOD), UPDATE_CODE_UPDATE)
						buff = append(buff, fd.GetUpdateBuffer()...)

						cache[fd.Id] = fd
					}
				} else {
					//create block
					buff = append(buff, byte(ENTITY_TYPE_FOOD), UPDATE_CODE_CREATE)
					buff = append(buff, fd.GetCreateBuffer()...)

					cache[fd.Id] = fd
				}

			case *PowerUp:
				g.Lock()
				cd = e.ToData().Copy()
				g.Unlock()
				ids[cd.Id] = true

				if _, ok := cache[cd.Id]; ok {
					//update block
					if wc = cd; wc != cache[cd.Id] {
						buff = append(buff, byte(ENTITY_TYPE_POWER_UP), UPDATE_CODE_UPDATE)
						buff = append(buff, cd.GetUpdateBuffer()...)

						cache[cd.Id] = cd
					}
				} else {
					//create block
					buff = append(buff, byte(ENTITY_TYPE_POWER_UP), UPDATE_CODE_CREATE)
					buff = append(buff, cd.GetCreateBuffer()...)

					cache[cd.Id] = cd
				}

			case *FartShoot:
				g.Lock()
				fsd = e.ToData().Copy()
				g.Unlock()
				ids[fsd.Id] = true

				if _, ok := cache[fsd.Id]; ok {
					//update block
					//todo check type
					if wc = fsd; wc != cache[fsd.Id] {
						buff = append(buff, byte(ENTITY_TYPE_FART_SHOOT), UPDATE_CODE_UPDATE)
						buff = append(buff, fsd.GetUpdateBuffer()...)

						cache[fsd.Id] = fsd
					}
				} else {
					//create block
					buff = append(buff, byte(ENTITY_TYPE_FART_SHOOT), UPDATE_CODE_CREATE)
					buff = append(buff, fsd.GetCreateBuffer()...)

					cache[fsd.Id] = fsd
				}

			case *Medicine:
				g.Lock()
				md = e.ToData().Copy()
				g.Unlock()
				ids[md.Id] = true

				if _, ok := cache[md.Id]; ok {
					//update block
					if wc = md; wc != cache[md.Id] {
						buff = append(buff, byte(ENTITY_TYPE_MEDICINE), UPDATE_CODE_UPDATE)
						buff = append(buff, md.GetUpdateBuffer()...)

						cache[md.Id] = md
					}
				} else {
					//create block
					buff = append(buff, byte(ENTITY_TYPE_MEDICINE), UPDATE_CODE_CREATE)
					buff = append(buff, md.GetCreateBuffer()...)

					cache[md.Id] = md
				}

			}

		}
	}

	for n, v := range cache {
		if v != nil {
			if !ids[n] {
				assasin := -1
				if _id, ok := (*g.entitiesKilled[0])[n]; ok {
					assasin = _id
				}

				buff = append(
					buff,

					byte(ENTITY_TYPE_MISC),
					UPDATE_CODE_REMOVE,

					byte(n>>8&0xff),
					byte(n>>0&0xff),

					byte(assasin>>8&0xff),
					byte(assasin>>0&0xff),
				)

				delete(cache, n)
			}
		}
	}

	return buff
}

func PlayersLen(g *Game) int {
	return len(g.players)
}

func (g *Game) Start() {
	g.loop.Start()
	logger.Info("[", g.Id, "] Starting game...")
}

func (g *Game) Stop() {
	if !g.loop.IsRunning() {
		return
	}

	logger.Info("[", g.Id, "] Stoping game...")
	g.loop.Stop()
}

func (g *Game) PlayersLen() int {
	g.Lock()
	defer g.Unlock()
	return len(g.players)
}

func (g *Game) AddPlayer(ws *WSConnection) {
	g.Lock()
	id := g.getUniqueID()
	a := g.pool.AllocActor()
	a.Initialize(id, ws)
	a.OnDropMass = g.dropActorMass
	a.OnBurningMass = g.burningActorMass
	a.OnFire = g.fireActorMass
	a.OnBoundDeath = g.actorOutOfBounds
	g.setActorInSafePosition(a)

	g.actors = append(g.actors, a)
	g.players = append(g.players, ws)

	g.addEntity(id, a)
	ws.Actor = a
	ws.SendInitialData(g.GetInitialDataFor(ws))

	logger.Debugf("Added new player id: %d, name: %s", id, a.Name)
	logger.Infof("Total players online: %d", PlayersLen(g))
	g.Unlock()
}

func (g *Game) PlayersAndBotsLength() (int, int) {
	g.Lock()
	p := len(g.players)
	b := g.botsCount
	g.Unlock()
	return p, b
}

func (g *Game) RemovePlayer(ws *WSConnection) {
	g.Lock()
	if i := g.indexOfPlayer(ws); i != -1 {
		logger.Debugf("Remove player id: %d, name: %s", g.players[i].Actor.Id, g.players[i].Actor.Name)
		g.players[i] = nil
		g.players = append(g.players[:i], g.players[i+1:]...)

		logger.Debug("Sending from game to WS close signal")
		go ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)

		logger.Infof("Total players online: %d", PlayersLen(g))
	}
	g.Unlock()
}

func (g *Game) IsPlayerIn(ws *WSConnection) bool {
	return g.indexOfPlayer(ws) != -1
}

func (g *Game) GetInitialDataFor(ws *WSConnection) (int, *ActorData) {
	//todo send radar info
	return g.size / 100, ws.Actor.ToData()
}

func (g *Game) dropActorMass(x, y, mass float64) {
	g.spawnFood(x, y, mass)
}

func (g *Game) burningActorMass(x, y, angle, mass, actorRadius float64) {
	f := g.spawnFood(x, y, mass)
	f.SetMovement(angle, 300+actorRadius+rand.Float64()*400)
}

func (g *Game) spawnFood(x, y, mass float64) *Food {
	g.Lock()
	id := g.getUniqueID()
	f := g.pool.AllocFood()
	f.Initialize(id, mass)

	if x != 0 || y != 0 {
		f.Position.Set(x, y)
	} else {
		g.setFoodInSafePosition(f, 0)
	}

	f.OnExpireOut = g.onFoodExpireOut
	g.foodCount++
	g.foods = append(g.foods, f)

	g.addEntity(id, f)

	g.Unlock()
	return f
}

func (g *Game) spawnMedicine(index int) {
	id := g.getUniqueID()
	var m *Medicine
	if g.medicines[index] == nil {
		m = g.pool.AllocMedicine()
		g.medicines[index] = m
	} else {
		m = g.medicines[index]
	}

	m.Reset()
	m.Initialize(id, g.size)
	m.State = STATE_ALIVE

	g.setMedicineInSafePosition(m)
	g.addEntity(id, m)
}

func (g *Game) onFoodExpireOut(f *Food) {
	g.foodsToKill = append(g.foodsToKill, f)
	f.State = STATE_DEAD
	g.foodCount--
}

func (g *Game) fireActorMass(a *Actor, x, y, speed, angle, mass float64, fartType FartType) {
	g.Lock()
	id := g.getUniqueID()
	f := g.pool.AllocFartShoot()
	f.Initialize(id, mass, fartType)
	f.OnExpire = g.expiredFire
	f.SetDestination(a, x, y, speed, angle)

	g.addEntity(id, f)
	g.fartShoots = append(g.fartShoots, f)
	g.Unlock()
}

func (g *Game) actorOutOfBounds(a *Actor) {
	a.State = STATE_DEAD
	g.actorsToKill = append(g.actorsToKill, a)

	if !a.IsBot() {
		if a.Stats() != nil {
			a.Stats().SetDeathBy(DeathByOut)
		}
		a.Conn.GameOver(len(g.actors))
	}
}

func (g *Game) expiredFire(f *FartShoot) {
	f.State = STATE_DEAD
	g.fartShootsToKill = append(g.fartShootsToKill, f)
}

func (g *Game) spawnBot() {
	id := g.getUniqueID()
	a := g.pool.AllocActor()
	a.Initialize(id, nil)
	g.setActorInSafePosition(a)
	a.OnFire = g.fireActorMass
	a.OnDropMass = g.dropActorMass
	a.OnBurningMass = g.burningActorMass
	g.botsCount++
	g.actors = append(g.actors, a)

	g.addEntity(id, a)
}

func (g *Game) killActor(a *Actor) {
	//g.Lock()
	g.actorsToKill = append(g.actorsToKill, a)
	a.State = STATE_DEAD

	if a.IsBot() {
		g.botsCount--
	} else if a.Conn != nil {
		a.Conn.GameOver(len(g.actors))
	}

	if g.botsCount < MAX_BOTS && len(g.actors) < MAX_BOTS {
		g.spawnBot()
	}
	//g.Unlock()
}

func (g *Game) cleanWorld() {
	g.cleanActors()
	g.cleanFoods()
	g.cleanPowerUps()
	g.cleanFartShoots()
}

func (g *Game) cleanActors() {
	if len(g.actorsToKill) != 0 {
		for _, v := range g.actorsToKill {
			if i := g.indexOfActor(v); i != -1 {
				g.actors[i] = nil
				g.actors = append(g.actors[:i], g.actors[i+1:]...)
				g.removeEntity(v.Id)

				if v.IsBot() {
					g.pool.Free(v)
				}

			}
		}

		g.actorsToKill = []*Actor{}
	}
}

func (g *Game) cleanFoods() {
	if len(g.foodsToKill) != 0 {
		for _, v := range g.foodsToKill {
			if i := g.indexOfFood(v); i != -1 {
				g.foods[i] = nil
				g.foods = append(g.foods[:i], g.foods[i+1:]...)
				g.removeEntity(v.Id)

				g.pool.Free(v)
			}
		}

		g.foodsToKill = []*Food{}
	}
}

func (g *Game) cleanPowerUps() {
	if len(g.powerUpsToKill) != 0 {
		for _, v := range g.powerUpsToKill {
			if i := g.indexOfPowerUps(v); i != -1 {
				g.powerUps[i] = nil
				g.powerUps = append(g.powerUps[:i], g.powerUps[i+1:]...)
				g.removeEntity(v.Id)

				g.pool.Free(v)
			}
		}

		g.powerUpsToKill = []*PowerUp{}
	}
}

func (g *Game) cleanFartShoots() {
	if len(g.fartShootsToKill) != 0 {
		for _, v := range g.fartShootsToKill {
			if i := g.indexOfFartShoots(v); i != -1 {
				g.fartShoots[i] = nil
				g.fartShoots = append(g.fartShoots[:i], g.fartShoots[i+1:]...)
				g.removeEntity(v.Id)

				g.pool.Free(v)
			}
		}

		g.fartShootsToKill = []*FartShoot{}
	}
}

func (g *Game) indexOfActor(a *Actor) int {
	index := -1
	for n, v := range g.actors {
		if v == a {
			index = n
			break
		}
	}

	return index
}

func (g *Game) indexOfFood(f *Food) int {
	index := -1
	for n, v := range g.foods {
		if v == f {
			index = n
			break
		}
	}

	return index
}

func (g *Game) indexOfPowerUps(c *PowerUp) int {
	index := -1
	for n, v := range g.powerUps {
		if v == c {
			index = n
			break
		}
	}

	return index
}

func (g *Game) indexOfFartShoots(c *FartShoot) int {
	index := -1
	for n, v := range g.fartShoots {
		if v == c {
			index = n
			break
		}
	}

	return index
}

func (g *Game) setActorInSafePosition(a *Actor) {
	size := float64(g.size * 75 / 100)
	ss := size / 2

	for {
		a.Position.Set(
			-ss+a.Radius+rand.Float64()*(size-a.Radius),
			-ss+a.Radius+rand.Float64()*(size-a.Radius),
		)

		c := false
		for _, v := range g.actors {
			if g.existsCollisionBetween(v.Radius, a.Radius, v.Position, a.Position, 200) {
				c = true
				break
			}
		}

		if !c {
			break
		}
	}
}

func (g *Game) setMedicineInSafePosition(m *Medicine) {
	size := float64(g.size)
	ss := size / 2

	for {
		m.Position.Set(
			-ss+m.Radius+math.Floor(rand.Float64()*(size-m.Radius)),
			-ss+m.Radius+math.Floor(rand.Float64()*(size-m.Radius)),
		)

		c := false
		for _, v := range g.actors {
			if g.existsCollisionBetween(v.Radius, m.Radius, v.Position, m.Position, 300) {
				c = true
				break
			}
		}

		if !c {
			break
		}
	}
}

func (g *Game) setFoodInSafePosition(f *Food, percent float64) {
	var radiusPercent float64

	if percent == 0 {
		rnd := rand.Float64()

		if rnd < 0.25 {
			radiusPercent = 0.3
		} else if rnd < 0.45 {
			radiusPercent = 0.6
		} else if rnd < 0.65 {
			radiusPercent = 0.8
		} else {
			radiusPercent = 0.98
		}

	} else {
		radiusPercent = percent
	}

	size := float64(g.size) * radiusPercent
	ss := size / 2

	for {
		f.Position.Set(
			-ss+f.Radius+math.Floor(rand.Float64()*(size-f.Radius)),
			-ss+f.Radius+math.Floor(rand.Float64()*(size-f.Radius)),
		)

		c := false
		for _, v := range g.foods {
			if g.existsCollisionBetween(v.Radius, f.Radius, v.Position, f.Position, 130) {
				c = true
				break
			}
		}

		if !c {
			for _, v := range g.actors {
				if g.existsCollisionBetween(v.Radius, f.Radius, v.Position, f.Position, 130) {
					c = true
					break
				}
			}
		}

		if !c {
			break
		}

	}
}

func (g *Game) existsCollisionBetween(r1, r2 float64, p1, p2 *Point, radiusPercent float64) bool {
	m := radiusPercent / 100
	xx := p1.X - p2.X
	yy := p1.Y - p2.Y
	distance := math.Sqrt(xx*xx + yy*yy)

	var radius1, radius2 float64
	if r1 <= r2 {
		radius1 = r1 * m
		radius2 = r2
	} else {
		radius1 = r2 * m
		radius2 = r1
	}
	return distance < radius1+radius2
}

func (g *Game) existsRectCollision(x, y, width, height float64, a *Actor) bool {
	if x+width < a.Position.X {
		return false
	}

	if x > a.Position.X+a.Radius {
		return false
	}

	if y+height < a.Position.Y {
		return false
	}

	if y > a.Position.Y+a.Radius {
		return false
	}

	return true
}

func (g *Game) addEntity(id int, e interface{}) {
	g.entities[id] = e
}

func (g *Game) removeEntity(id int) {
	g.entities[id] = nil
}

func (g *Game) indexOfPlayer(ws *WSConnection) int {
	index := -1
	for n, v := range g.players {
		if v == ws {
			index = n
			break
		}
	}

	return index
}

func (g *Game) getUniqueID() int {
	index := -1
	/*for n, v := range g.entities {
		if v == nil && n > 0 {
			index = n
			break
		}
	}*/

	//logger.Debug("Ids index", g.entitiesIndex)
	if g.entitiesIndex > MAX_IDS_TO_ASSIGN {
		logger.Debugf("Reached the max ids to assign (%d), reseting to 0", MAX_IDS_TO_ASSIGN)
		g.entitiesIndex = 0
	}

	llen := len(g.entities)
	for i := g.entitiesIndex; i < llen; i++ {
		if g.entities[i] == nil && i > 0 {
			index = i
			break
		}
	}

	if index == -1 {
		g.entities = append(g.entities, nil)
		index = len(g.entities) - 1
	}

	g.entitiesIndex = index
	//logger.Debug("Setted id index to", index)
	return index
}

func SafeMarginMass(mass float64) float64 {
	return 25 + mass*0.025
}
