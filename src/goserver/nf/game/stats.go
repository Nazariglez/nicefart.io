/**
 * Created by nazarigonzalez on 27/12/16.
 */

package game

import (
	"../db"
	"../logger"
	"encoding/json"
	"math"
	"sync"
	"time"
)

const (
	DeathByNothing int = iota
	DeathByPlayer
	DeathByOut
	DeathByMedicine
	DeathByBot
)

type GameStats struct {
	sync.Mutex

	user               string
	name               string
	skin               string
	costume            string
	startDate          int64
	endDate            int64
	gameTime           int64
	maxMass            float64
	foodEaten          int
	playersKilled      int
	botsKilled         int
	bytesIn            int
	bytesOut           int
	powerUpStar        int
	powerUpPepper      int
	powerUpMulti       int
	fartsFired         int
	fartsTaken         int
	fireFartsFired     int
	fireFartsTaken     int
	deathBy            int
	outTime            float64
	killerUser         string //if guest "" if user -> id
	killerName         string
	runTime            float64
	massLostByFart     float64
	massLostByTime     float64
	massLostByStar     float64
	massLostByDrop     float64
	massLostByFireFart float64
	maxTop             int
	topTime            float64
	maxMassKilled      float64
	points             int
}

func NewGameStats() *GameStats {
	return &GameStats{}
}

func (g *GameStats) User() string {
	g.Lock()
	defer g.Unlock()

	return g.user
}

func (g *GameStats) SetUser(u string) {
	g.Lock()
	defer g.Unlock()

	g.user = u
}

func (g *GameStats) Name() string {
	g.Lock()
	defer g.Unlock()

	return g.name
}

func (g *GameStats) SetName(n string) {
	g.Lock()
	defer g.Unlock()

	g.name = n
}

func (g *GameStats) Skin() string {
	g.Lock()
	defer g.Unlock()

	return g.skin
}

func (g *GameStats) SetSkin(s string) {
	g.Lock()
	defer g.Unlock()

	g.skin = s
}

func (g *GameStats) Costume() string {
	g.Lock()
	defer g.Unlock()

	return g.costume
}

func (g *GameStats) SetCostume(c string) {
	g.Lock()
	defer g.Unlock()

	g.costume = c
}

func (g *GameStats) StartDate() int64 {
	g.Lock()
	defer g.Unlock()

	return g.startDate
}

func (g *GameStats) SetStartDate(d int64) {
	g.Lock()
	defer g.Unlock()

	g.startDate = d
}

func (g *GameStats) EndDate() int64 {
	g.Lock()
	defer g.Unlock()

	return g.endDate
}

func (g *GameStats) SetEndDate(d int64) {
	g.Lock()
	defer g.Unlock()

	g.endDate = d
}

func (g *GameStats) GameTime() int64 {
	g.Lock()
	defer g.Unlock()

	return g.gameTime
}

func (g *GameStats) SetGameTime(t int64) {
	g.Lock()
	defer g.Unlock()

	g.gameTime = t
}

func (g *GameStats) MaxMass() float64 {
	g.Lock()
	defer g.Unlock()

	return g.maxMass
}

func (g *GameStats) SetMaxMass(m float64) {
	g.Lock()
	defer g.Unlock()

	g.maxMass = m
}

func (g *GameStats) FoodEaten() int {
	g.Lock()
	defer g.Unlock()

	return g.foodEaten
}

func (g *GameStats) SetFoodEaten(v int) {
	g.Lock()
	defer g.Unlock()

	g.foodEaten = v
}

func (g *GameStats) IncrementFoodEaten(v int) {
	g.Lock()
	defer g.Unlock()

	g.foodEaten += v
}

func (g *GameStats) PlayersKilled() int {
	g.Lock()
	defer g.Unlock()

	return g.playersKilled
}

func (g *GameStats) SetPlayersKilled(v int) {
	g.Lock()
	defer g.Unlock()

	g.playersKilled = v
}

func (g *GameStats) IncrementPlayersKilled(v int) {
	g.Lock()
	defer g.Unlock()

	g.playersKilled += v
}

func (g *GameStats) BotsKilled() int {
	g.Lock()
	defer g.Unlock()

	return g.botsKilled
}

func (g *GameStats) SetBotsKilled(v int) {
	g.Lock()
	defer g.Unlock()

	g.botsKilled = v
}

func (g *GameStats) IncrementBotsKilled(v int) {
	g.Lock()
	defer g.Unlock()

	g.botsKilled += v
}

func (g *GameStats) BytesIn() int {
	g.Lock()
	defer g.Unlock()

	return g.bytesIn
}

func (g *GameStats) SetBytesIn(v int) {
	g.Lock()
	defer g.Unlock()

	g.bytesIn = v
}

func (g *GameStats) IncrementBytesIn(v int) {
	g.Lock()
	defer g.Unlock()

	g.bytesIn += v
}

func (g *GameStats) BytesOut() int {
	g.Lock()
	defer g.Unlock()

	return g.bytesOut
}

func (g *GameStats) SetBytesOut(v int) {
	g.Lock()
	defer g.Unlock()

	g.bytesOut = v
}

func (g *GameStats) IncrementBytesOut(v int) {
	g.Lock()
	defer g.Unlock()

	g.bytesOut += v
}

func (g *GameStats) PowerUpStar() int {
	g.Lock()
	defer g.Unlock()

	return g.powerUpStar
}

func (g *GameStats) SetPowerUpStar(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpStar = v
}

func (g *GameStats) IncrementPowerUpStar(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpStar += v
}

func (g *GameStats) PowerUpPepper() int {
	g.Lock()
	defer g.Unlock()

	return g.powerUpPepper
}

func (g *GameStats) SetPowerUpPepper(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpPepper = v
}

func (g *GameStats) IncrementPowerUpPepper(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpPepper += v
}

func (g *GameStats) PowerUpMulti() int {
	g.Lock()
	defer g.Unlock()

	return g.powerUpMulti
}

func (g *GameStats) SetPowerUpMulti(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpMulti = v
}

func (g *GameStats) IncrementPowerUpMulti(v int) {
	g.Lock()
	defer g.Unlock()

	g.powerUpMulti += v
}

func (g *GameStats) FartsFired() int {
	g.Lock()
	defer g.Unlock()

	return g.fartsFired
}

func (g *GameStats) SetFartsFired(v int) {
	g.Lock()
	defer g.Unlock()

	g.fartsFired = v
}

func (g *GameStats) IncrementFartsFired(v int) {
	g.Lock()
	defer g.Unlock()

	g.fartsFired += v
}

func (g *GameStats) FartsTaken() int {
	g.Lock()
	defer g.Unlock()

	return g.fartsTaken
}

func (g *GameStats) SetFartsTaken(v int) {
	g.Lock()
	defer g.Unlock()

	g.fartsTaken = v
}

func (g *GameStats) IncrementFartsTaken(v int) {
	g.Lock()
	defer g.Unlock()

	g.fartsTaken += v
}

func (g *GameStats) FireFartsFired() int {
	g.Lock()
	defer g.Unlock()

	return g.fireFartsFired
}

func (g *GameStats) SetFireFartsFired(v int) {
	g.Lock()
	defer g.Unlock()

	g.fireFartsFired = v
}

func (g *GameStats) IncrementFireFartsFired(v int) {
	g.Lock()
	defer g.Unlock()

	g.fireFartsFired += v
}

func (g *GameStats) FireFartsTaken() int {
	g.Lock()
	defer g.Unlock()

	return g.fireFartsTaken
}

func (g *GameStats) SetFireFartsTaken(v int) {
	g.Lock()
	defer g.Unlock()

	g.fireFartsTaken = v
}

func (g *GameStats) IncrementFireFartsTaken(v int) {
	g.Lock()
	defer g.Unlock()

	g.fireFartsTaken += v
}

func (g *GameStats) DeathBy() int {
	g.Lock()
	defer g.Unlock()

	return g.deathBy
}

func (g *GameStats) SetDeathBy(v int) {
	g.Lock()
	defer g.Unlock()

	g.deathBy = v
}

func (g *GameStats) OutTime() float64 {
	g.Lock()
	defer g.Unlock()

	return g.outTime
}

func (g *GameStats) SetOutTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.outTime = v
}

func (g *GameStats) IncrementOutTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.outTime += v
}

func (g *GameStats) KillerUser() string {
	g.Lock()
	defer g.Unlock()

	return g.killerUser
}

func (g *GameStats) SetKillerUser(v string) {
	g.Lock()
	defer g.Unlock()

	g.killerUser = v
}

func (g *GameStats) KillerName() string {
	g.Lock()
	defer g.Unlock()

	return g.killerName
}

func (g *GameStats) SetKillerName(v string) {
	g.Lock()
	defer g.Unlock()

	g.killerName = v
}

func (g *GameStats) RunTime() float64 {
	g.Lock()
	defer g.Unlock()

	return g.runTime
}

func (g *GameStats) SetRunTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.runTime = v
}

func (g *GameStats) IncrementRunTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.runTime += v
}

func (g *GameStats) MassLostByFart() float64 {
	g.Lock()
	defer g.Unlock()

	return g.massLostByFart
}

func (g *GameStats) SetMassLostByFart(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByFart = v
}

func (g *GameStats) IncrementMassLostByFart(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByFart += v
}

func (g *GameStats) MassLostByTime() float64 {
	g.Lock()
	defer g.Unlock()

	return g.massLostByTime
}

func (g *GameStats) SetMassLostByTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByTime = v
}

func (g *GameStats) IncrementMassLostByTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByTime += v
}

func (g *GameStats) MassLostByStar() float64 {
	g.Lock()
	defer g.Unlock()

	return g.massLostByStar
}

func (g *GameStats) SetMassLostByStar(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByStar = v
}

func (g *GameStats) IncrementMassLostByStar(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByStar += v
}

func (g *GameStats) MassLostByDrop() float64 {
	g.Lock()
	defer g.Unlock()

	return g.massLostByDrop
}

func (g *GameStats) SetMassLostByDrop(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByDrop = v
}

func (g *GameStats) IncrementMassLostByDrop(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByDrop += v
}

func (g *GameStats) MassLostByFireFart() float64 {
	g.Lock()
	defer g.Unlock()

	return g.massLostByFireFart
}

func (g *GameStats) SetMassLostByFireFart(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByTime = v
}

func (g *GameStats) IncrementMassLostByFireFart(v float64) {
	g.Lock()
	defer g.Unlock()

	g.massLostByFireFart += v
}

func (g *GameStats) MaxTop() int {
	g.Lock()
	defer g.Unlock()

	return g.maxTop
}

func (g *GameStats) SetMaxTop(v int) {
	g.Lock()
	defer g.Unlock()

	g.maxTop = v
}

func (g *GameStats) TopTime() float64 {
	g.Lock()
	defer g.Unlock()

	return g.topTime
}

func (g *GameStats) SetTopTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.topTime = v
}

func (g *GameStats) IncrementTopTime(v float64) {
	g.Lock()
	defer g.Unlock()

	g.topTime += v
}

func (g *GameStats) MaxMassKilled() float64 {
	g.Lock()
	defer g.Unlock()

	return g.maxMassKilled
}

func (g *GameStats) SetMaxMassKilled(v float64) {
	g.Lock()
	defer g.Unlock()

	g.maxMassKilled = v
}

func (g *GameStats) Points() int {
	g.Lock()
	defer g.Unlock()

	return g.points
}

func (g *GameStats) SetPoints(v int) {
	g.Lock()
	defer g.Unlock()

	g.points = v
}

func (s *GameStats) ToJSON() []byte {
	s.Lock()
	defer s.Unlock()

	buff, err := json.Marshal(s)
	if err != nil {
		logger.Errorf("Parsing GameStat to json [%+v]", s)
		return []byte{}
	}

	return buff
}

func (s *GameStats) CalculatePoints() int {
	s.Lock()
	defer s.Unlock()

	//gameTime 16% (0-20 min)
	t := float64(s.gameTime) / 60
	gt := math.Ceil((16 * t) / 20)
	if gt > 16 {
		gt = 16
	}

	//maxMass 30% (0-(actorMaxMass*90%))
	mm := math.Ceil((30 * s.maxMass) / (actorMaxMass * 90 / 100))
	if mm > 30 {
		mm = 30
	}

	//maxTop 30% (30-1)
	mt := 0.0
	if s.maxTop <= 30 {
		mt = math.Ceil(30 - (float64(s.maxTop) - 1))
	}

	//topTime 10% (0-9 min)
	t = s.topTime / 60
	tt := math.Ceil((10 * t) / 9)
	if tt > 10 {
		tt = 10
	}

	//kills 8% (0-120 kills)
	k := float64(s.playersKilled + s.botsKilled)
	kk := math.Ceil((8 * k) / 120)
	if kk > 8 {
		kk = 8
	}

	//maxMassKilled 6% (0-15000 mass)
	mk := math.Ceil((6 * s.maxMassKilled) / 15000)
	if mk > 6 {
		mk = 6
	}

	s.points = int(gt + mm + mt + tt + kk + mk)
	if s.points > 100 {
		s.points = 100
	}
	return s.points
}

func (g *GameStats) SaveToDB() error { //todo user
	g.Lock()
	defer g.Unlock()

	game := db.Game{
		//User: //todo
		Name:           g.name,
		Skin:           g.skin,
		Costume:        g.costume,
		ServerName:     SERVER_ID,
		StartDate:      time.Unix(g.startDate, 0),
		EndDate:        time.Unix(g.endDate, 0),
		GameTime:       g.gameTime,
		MaxMass:        int(g.maxMass),
		FoodEaten:      g.foodEaten,
		PlayersKilled:  g.playersKilled,
		BotsKilled:     g.botsKilled,
		BytesIn:        g.bytesIn,
		BytesOut:       g.bytesOut,
		PowerUpStar:    g.powerUpStar,
		PowerUpMulti:   g.powerUpMulti,
		PowerUpPepper:  g.powerUpPepper,
		FartsFired:     g.fartsFired,
		FartsTaken:     g.fartsTaken,
		FireFartsFired: g.fireFartsFired,
		FireFartsTaken: g.fireFartsTaken,
		DeathBy:        g.deathBy,
		OutTime:        int(g.outTime),
		//KillerUser: "", //todo
		KillerName:         g.killerName,
		RunTime:            int(g.runTime),
		MassLostByFart:     int(g.massLostByFart),
		MassLostByTime:     int(g.massLostByTime),
		MassLostByStar:     int(g.massLostByStar),
		MassLostByDrop:     int(g.massLostByDrop),
		MassLostByFireFart: int(g.massLostByFireFart),
		MaxTop:             g.maxTop,
		TopTime:            int(g.topTime),
		MaxMassKilled:      int(g.maxMassKilled),
		Points:             g.points,
	}

	logger.Debugf("Saving to db stats: %+v", game)
	return db.DB().Create(&game).Error
}

//System Stats
type SysStats struct {
	Date            int
	Memory          int
	CPU             int
	PlayerNum       int
	ActorNum        int
	FoodNum         int
	MapSize         int
	LoopTime        int
	WorldUpdateTime int
	GameTime        int
	BytesIn         int
	BytesOut        int
	TotalBytesIn    int
	TotalBytesOut   int
}
