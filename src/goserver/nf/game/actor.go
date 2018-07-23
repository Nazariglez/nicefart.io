/**
 * Created by nazarigonzalez on 14/10/16.
 */

package game

import (
	"math"
	"math/rand"
	"sync"

	"gopkg.in/nazariglez/go-easing.v0"
	"gopkg.in/nazariglez/go-rbush.v0"

	"../utils"
)

const (
	ACTOR_FLAG_SLOW = 1 << iota
	ACTOR_FLAG_FAST
	ACTOR_FLAG_OUT
	ACTOR_FLAG_CRAZY
	ACTOR_FLAG_BURNING
	ACTOR_FLAG_MULTI2
	ACTOR_FLAG_MULTI3
	ACTOR_FLAG_LOADING_PEPPER
	ACTOR_FLAG_FAST_PENALTY
)

const (
	INPUT_FLAG_FIRE = 1 << iota
	INPUT_FLAG_FAST
	INPUT_FLAG_PEPPER
)

type FartType byte

const (
	FART_TYPE_NORMAL FartType = iota
	FART_TYPE_PEPPER
)

const (
	actorMaxMass        = 80000
	actorFireTime       = 1.4
	actorSlowTime       = 0.4
	actorBoundDeathTime = 4
	actorCrazyTime      = 18000
	actorCrazyDelay     = 0.3
	actorMinMass        = 10

	actorMinRadius             = 10
	actorMaxRadius             = 600
	actorMaxMassRelativeRadius = 90000

	actorSpeedC       = 220
	actorMinSpeed     = 80
	actorFastSpeed    = 40
	actorMinFastSpeed = 20

	actorMaxFastTime = 5
	actorMinFastTime = 0.6
	actorFastPenalty = 3

	actorDrainMax    = 0.001
	actorDrainMin    = 0.0006
	actorBotDrain    = 0.0005
	actorDrainMargin = 0.0004

	actorDrainLimit = 200

	actorInitialPeppers    = 6
	actorPepperLoadingTime = 0.8
	actorPepperBoostTime   = 0.2
	actorBurningTime       = 3
	actorBurningDelay      = 0.2

	actorMultiTime = 20

	actorSecurityRadiusGrow = 0.9
)

var (
	actorSpeedEasing      = easing.InOutCubic()
	actorRadiusEasing     = easing.OutCirc()
	actorCrazySpeedEasing = easing.OutCubic()
	actorFastTimeEasing   = easing.OutExpo()
)

type Actor struct {
	sync.Mutex

	State EntityState

	Name                                string
	Skin                                []byte
	BuffName                            []byte
	Slow, Crazy, Fast, Fire, FirePepper bool
	Mass, Angle, Radius                 float64
	Id                                  int

	Peppers                            int
	loadingPepperFire, Burning         bool
	loadingPepperTime, pepperBoost     float64
	burningTime, RadiusTarget, Force   float64
	burningDelay, burningMass, Multi   float64
	multiTime, fastTime, fastTimeValue float64
	fastPenalty                        float64

	Brain *BotBrain

	Conn     *WSConnection
	Box      *rbush.Box
	Position *Point

	Data *ActorData

	OnDropMass    func(x, y, mass float64)
	OnBurningMass func(x, y, angle, mass, radius float64)
	OnFire        func(a *Actor, x, y, speed, angle, mass float64, fartType FartType)
	OnBoundDeath  func(a *Actor)

	FindingByMedicine int

	fastSpeed, CrazyTime, droppedMass  float64
	boundDeathTime, crazyDelay         float64
	delayFire, delaySlow, dropMassTime float64
	IA, dirty                          bool
	vectorSpeed                        *Point

	input      *InputInfo
	inputDirty bool
}

func NewEntityActor() *Actor {
	box := rbush.Box{}

	return &Actor{
		Id:       -1,
		State:    STATE_ALIVE,
		Skin:     []byte{},
		Conn:     nil,
		Box:      &box,
		Position: &Point{},
		Brain:    NewBotBrain(),
		Multi:    1,

		Data: &ActorData{},

		vectorSpeed:       &Point{},
		FindingByMedicine: -1,
		dirty:             true,

		input: &InputInfo{},
	}
}

func (a *Actor) Initialize(id int, c *WSConnection) {
	a.Conn = c
	a.Id = id
	a.SetMass(actorMinMass * 2.5)
	a.Radius = a.RadiusTarget
	a.Box.Data = a.Id
	a.Peppers = actorInitialPeppers
	a.Multi = 1
	a.fastTime = actorMaxFastTime
	a.fastTimeValue = actorMaxFastTime

	if a.IsBot() {
		a.IA = true
		a.Name = utils.GetRandomBotName()
		a.SetForce(1.0 + rand.Float64()*8.0)
		a.SetAngle(rand.Float64() * 359 * utils.DEG_TO_RAD)

		s := utils.GetRandomCustomSkin()
		a.Skin = s.ToByte()

		a.Brain.Reset()
		a.Peppers += 3
	} else {
		a.Name = a.Conn.ClientData.Name
		a.Skin = a.Conn.ClientData.Skin.ToByte()
	}

	a.BuffName = utils.BufferFromString(a.Name)
}

func (a *Actor) fastPercent() int {
	return int(math.Floor((a.fastTime * 100) / a.fastTimeValue))
}

func (a *Actor) IsBot() bool {
	return a.Conn == nil
}

func (a *Actor) Reset() {
	a.Id = -1
	a.Conn = nil
	a.IA = false
	a.Name = ""
	a.State = STATE_ALIVE
	a.Angle = 0
	a.Mass = 0
	a.Force = 0
	a.Fast = false
	a.Fire = false
	a.FirePepper = false
	a.Crazy = false
	a.Slow = false
	a.Radius = 0
	a.RadiusTarget = 0
	a.Burning = false
	a.Multi = 1
	a.burningDelay = 0
	a.fastPenalty = 0
	a.burningTime = 0
	a.Peppers = actorInitialPeppers

	a.delayFire = 0
	a.delaySlow = 0
	a.dropMassTime = 0
	a.droppedMass = 0
	a.boundDeathTime = 0
	a.CrazyTime = 0
	a.FindingByMedicine = -1
	a.pepperBoost = 0

	a.Position.Set(0, 0)
	a.vectorSpeed.Set(0, 0)

	a.Box.Data = -1
	a.Box.MaxY = 0
	a.Box.MaxX = 0
	a.Box.MinY = 0
	a.Box.MinX = 0

	a.input.Angle = 0
	a.input.Force = 0
	a.input.Flags = 0
}

func (a *Actor) applyInput() {
	if a.inputDirty {
		a.inputDirty = false
		a.SetFlags(a.input.Flags)
		a.SetAngle(a.input.Angle)
		a.SetForce(a.input.Force)
	}
}

func (a *Actor) Update(delta float64) {
	a.applyInput()

	if a.dirty {
		a.checkVectorSpeed()
		a.dirty = false
	}

	if a.Radius != a.RadiusTarget {
		if a.RadiusTarget-a.Radius > 0 {
			a.Radius += a.Radius * actorSecurityRadiusGrow * delta

			if a.Radius > a.RadiusTarget {
				a.Radius = a.RadiusTarget
			}
		} else {
			a.Radius = a.RadiusTarget
		}
	}

	a.Position.X += a.vectorSpeed.X * delta
	a.Position.Y += a.vectorSpeed.Y * delta

	if a.delayFire > 0 {
		a.delayFire -= delta
	}

	if a.Fire {
		a.fireMass(delta)
	}

	if a.multiTime > 0 {
		a.multiTime -= delta
		if a.multiTime <= 0 {
			a.Multi = 1
		}
	}

	if a.FirePepper && !a.loadingPepperFire && a.Peppers > 0 {
		mass := 10 + a.Mass*easing.Interpolate(0.1, 0.4, actorMaxMassRelativeRadius, a.Mass, easing.Linear())
		if a.Mass-mass > actorMinMass {
			a.Peppers -= 1
			a.loadingPepperFire = true
			a.loadingPepperTime = actorPepperLoadingTime
			a.SetMass(a.Mass - mass)
		}
	} else if a.loadingPepperFire {
		a.loadingPepperTime -= delta
		if a.loadingPepperTime <= 0 {
			a.firePepperMass(delta)
		}
	} else if a.pepperBoost > 0 {
		a.dirty = true
		a.pepperBoost -= delta
	}

	a.setFastTime(delta)
	if a.Fast {
		a.dropMass(delta)

		if a.Stats() != nil {
			a.Stats().IncrementRunTime(delta)
		}
	}

	if a.Burning && a.burningTime > 0 {
		a.burningTime -= delta

		if a.burningTime < 0 {
			a.SetBurning(false)
		} else {
			a.burnMass(delta)
		}
	}

	if a.Slow {
		a.delaySlow += delta
		if a.delaySlow >= actorSlowTime {
			a.SetSlow(false)
			a.delaySlow = 0
		}
	}

	if a.Crazy {
		a.CrazyTime -= delta
		if a.CrazyTime <= 0 {
			a.SetCrazy(false)
			a.crazyDelay = actorCrazyDelay
		}
	} else if a.crazyDelay > 0 {
		a.crazyDelay -= delta
	}

	if a.Mass > actorMinMass {
		var drain float64

		if a.IsBot() && a.IA {
			drain = actorBotDrain * delta
		} else if a.IsBot() {
			drain = actorDrainMax * 2 * delta
		} else if !a.IsBot() && a.Mass > actorDrainLimit {
			margin := easing.Interpolate(0, actorDrainMargin, actorMaxMassRelativeRadius, a.Mass, easing.Linear())

			if a.Force <= 0.1 {
				drain = (actorDrainMax + margin) * delta
			} else {
				drain = (actorDrainMin + margin) * delta
			}

		}

		if drain > 0 {
			m := a.Mass * drain
			a.SetMass(a.Mass - m)
			if a.Stats() != nil {
				a.Stats().IncrementMassLostByTime(m)
			}
		}

	}

	if a.Stats() != nil && a.Conn.LastTopPosition != -1 && a.Conn.LastTopPosition == 1 {
		a.Stats().IncrementTopTime(delta)
	}

	//bots grow faster ;)
	if a.IsBot() && a.Mass <= (actorMaxMassRelativeRadius/8) && rand.Float64() < 0.015 {
		a.SetMass(a.Mass + a.Mass*0.01*delta)
	}

	/*if !a.IsBot() {
		a.SetMass(a.Mass + a.Mass*0.3*delta)
	}*/
}

func (a *Actor) SetInput(flags byte, angle, force float64) {
	a.Lock()
	a.input.Flags = flags
	a.input.Force = force
	a.input.Angle = angle
	a.inputDirty = true
	a.Unlock()
}

func (a *Actor) UpdateIA(delta float64) {
	a.Brain.Time -= delta
	if a.IA && a.Brain.Target != nil {

		if a.Brain.Target.State != STATE_ALIVE {
			a.Brain.State = BRAIN_STATE_SEARCH_FOOD
			a.Brain.Time = -1
			return
		}

		if a.Brain.State == BRAIN_STATE_RUN_AWAY {

			a.SetAngle(-(a.Position.Angle(a.Brain.Target.Position) + (-45+rand.Float64()*45)*utils.DEG_TO_RAD))
			a.SetForce(10)

		} else if a.Brain.State == BRAIN_STATE_KILLING {

			if a.Crazy && a.CrazyTime < 0.95 && a.Brain.Target.Mass > a.Mass {
				a.Brain.State = BRAIN_STATE_RUN_AWAY
				a.Brain.Time = -1
			} else if a.Crazy {
				if rand.Float64() < 0.15 {
					a.SetAngle(a.Position.Angle(a.Brain.Target.Position) + (-45+rand.Float64()*45)*utils.DEG_TO_RAD)
					a.SetForce(10)
				}
			} else if a.Brain.Target.Crazy {
				a.Brain.State = BRAIN_STATE_RUN_AWAY
				a.Brain.Time = -1
			} else if a.Mass > a.Brain.Target.Mass {
				a.SetAngle(a.Position.Angle(a.Brain.Target.Position) + (-45+rand.Float64()*45)*utils.DEG_TO_RAD)
				a.SetForce(10)
			} else {
				a.Brain.State = BRAIN_STATE_SEARCH_FOOD
				a.Brain.Time = -1
			}

		}
	}
}

func (a *Actor) UpdateBox() {
	a.Box.MinX = a.Position.X - a.Radius
	a.Box.MinY = a.Position.Y - a.Radius
	a.Box.MaxX = a.Position.X + a.Radius
	a.Box.MaxY = a.Position.Y + a.Radius
}

func (a *Actor) FixPosition(delta float64, x, y float64) {
	if a.IsBot() {
		if a.Position.X < -x {
			a.Position.X = -x
		} else if a.Position.X > x {
			a.Position.X = x
		}

		if a.Position.Y < -y {
			a.Position.Y = -y
		} else if a.Position.Y > y {
			a.Position.Y = y
		}
	} else {
		if a.Position.X < -x || a.Position.X > x || a.Position.Y < -y || a.Position.Y > y {
			a.outOfBounds(delta)
		} else if a.boundDeathTime != 0 {
			a.boundDeathTime = 0
		}
	}
}

func (a *Actor) CanBeCrazy() bool {
	return a.crazyDelay <= 0
}

func (a *Actor) SetCrazy(v bool) {
	if v == a.Crazy {
		return
	}

	a.Crazy = v
	if a.Crazy {
		a.CrazyTime = actorCrazyTime / 1000
		a.dirty = true
	}
}

func (a *Actor) SetMulti(v float64) {
	if v == a.Multi {
		return
	}

	a.Multi = v
	if a.Multi > 1 {
		a.multiTime = actorMultiTime
	}
}

func (a *Actor) SetBurning(v bool) {
	if v == a.Burning {
		return
	}

	a.Burning = v

	if v {
		a.burningTime = actorBurningTime
	}
}

func (a *Actor) fireMass(d float64) {
	//todo movement against fire angle (like a minor jump) and shake the screen
	m := 10 + a.Mass*0.05

	if a.delayFire <= 0 && a.Mass-m > actorMinMass {
		a.delayFire = actorFireTime
		if a.IsBot() {
			a.SetMass(a.Mass - m/2)
		} else {
			a.SetMass(a.Mass - m)
		}
		a.OnFire(a, a.Position.X, a.Position.Y, a.Speed()+80, a.Angle, m*0.7, FART_TYPE_NORMAL)
		if a.Stats() != nil {
			a.Stats().IncrementFartsFired(1)
			a.Stats().IncrementMassLostByFart(m)
		}
	}

	a.SetFire(false)
}

func (a *Actor) firePepperMass(d float64) {
	a.loadingPepperFire = false
	a.pepperBoost = actorPepperBoostTime
	a.OnFire(a, a.Position.X, a.Position.Y, 0, a.Angle+180*utils.DEG_TO_RAD, 65, FART_TYPE_PEPPER)

	if a.Stats() != nil {
		a.Stats().IncrementFireFartsFired(1)
	}

	a.SetFirePepper(false)
}

func (a *Actor) dropMass(delta float64) {
	a.dropMassTime += delta

	if a.Mass > actorMinMass+1 {
		droppedMass := (10 + a.Mass*0.007) * delta
		a.droppedMass += droppedMass
		if a.IsBot() {
			a.SetMass(a.Mass - droppedMass/2)
		} else {

			a.SetMass(a.Mass - droppedMass)
			if a.Stats() != nil {
				a.Stats().IncrementMassLostByDrop(droppedMass)
			}

		}
	} else {
		a.SetFast(false)
	}

	if a.dropMassTime >= 0.4 && a.droppedMass > 0 {
		cosX := math.Cos(a.Angle)
		sinY := math.Sin(a.Angle)
		massCreated := a.droppedMass * 0.7
		speed := a.Speed() + (a.Radius*1.1+CalculateFoodRadius(massCreated))/delta

		x := a.Position.X - (speed*cosX)*delta
		y := a.Position.Y - (speed*sinY)*delta

		a.dropMassTime = 0
		a.droppedMass = 0

		a.OnDropMass(x, y, math.Floor(massCreated))
	}

}

func (a *Actor) burnMass(delta float64) {
	a.burningDelay += delta

	if a.Mass > actorMinMass+1 {
		burnedMass := (10 + a.Mass*(0.57/actorBurningTime)) * delta
		a.burningMass += burnedMass
		if a.IsBot() {
			a.SetMass(a.Mass - burnedMass*0.9)
		} else {
			a.SetMass(a.Mass - burnedMass)

			if a.Stats() != nil {
				a.Stats().IncrementMassLostByFireFart(burnedMass)
			}
		}
	}

	if a.burningDelay >= actorBurningDelay && a.burningMass > 0 {
		angle := (rand.Float64() * 360) * utils.DEG_TO_RAD
		massCreated := a.burningMass * 0.8

		a.burningDelay = 0
		a.burningMass = 0

		a.OnBurningMass(a.Position.X, a.Position.Y, angle, math.Floor(massCreated), a.Radius)
	}
}

func (a *Actor) outOfBounds(d float64) {
	a.boundDeathTime += d

	if a.Stats() != nil {
		a.Stats().IncrementOutTime(d)
	}

	if a.boundDeathTime >= actorBoundDeathTime {
		a.OnBoundDeath(a)
	}
}

func (a *Actor) checkVectorSpeed() {
	cosX := math.Cos(a.Angle)
	sinY := math.Sin(a.Angle)

	speed := a.Speed()
	if a.pepperBoost > 0 {
		speed *= 6
	}

	if a.Fast {
		speed = speed + a.fastSpeed
	}

	a.vectorSpeed.Set(
		speed*cosX,
		speed*sinY,
	)
}

func (a *Actor) ToData() *ActorData {
	a.Data.Id = a.Id
	a.Data.Type = ENTITY_TYPE_ACTOR
	a.Data.Name = a.Name
	a.Data.BuffName = a.BuffName
	a.Data.X = math.Floor(a.Position.X)
	a.Data.Y = math.Floor(a.Position.Y)
	a.Data.Radius = math.Floor(a.Radius)
	a.Data.Mass = math.Floor(a.Mass)
	a.Data.Flags = a.getFlags()
	a.Data.Multi = a.Multi
	a.Data.Peppers = a.Peppers
	a.Data.FastPercent = a.fastPercent()

	if a.Crazy {
		a.Data.Crazy = math.Floor(a.CrazyTime * 1000.0)
	} else {
		a.Data.Crazy = 0
	}
	a.Data.Skin = a.Skin

	return a.Data
}

func (a *Actor) IsOutOfBounds() bool {
	return a.boundDeathTime != 0
}

func (a *Actor) getFlags() int {
	flag := 0

	if a.Slow {
		flag |= ACTOR_FLAG_SLOW
	}

	if a.Fast {
		flag |= ACTOR_FLAG_FAST
	}

	if a.IsOutOfBounds() {
		flag |= ACTOR_FLAG_OUT
	}

	if a.Crazy {
		flag |= ACTOR_FLAG_CRAZY
	}

	if a.burningTime > 0 {
		flag |= ACTOR_FLAG_BURNING
	}

	if a.Multi == 2 {
		flag |= ACTOR_FLAG_MULTI2
	} else if a.Multi == 3 {
		flag |= ACTOR_FLAG_MULTI3
	}

	if a.loadingPepperFire {
		flag |= ACTOR_FLAG_LOADING_PEPPER
	}

	if a.fastPenalty > 0 {
		flag |= ACTOR_FLAG_FAST_PENALTY
	}

	return flag
}

func (a *Actor) SetFlags(f byte) {
	a.SetFast(f&INPUT_FLAG_FAST != 0)
	a.SetFire(f&INPUT_FLAG_FIRE != 0)
	a.SetFirePepper(f&INPUT_FLAG_PEPPER != 0)
}

func (a *Actor) SetFast(v bool) {
	if v != a.Fast {

		valid := true
		if v && (a.fastPenalty > 0 || a.fastTime <= 0) {
			valid = false
		}

		if valid && a.Mass > actorMinMass+1 {
			a.Fast = v

			if a.Mass >= actorMaxMass {
				a.fastSpeed = actorFastSpeed
			} else {
				a.fastSpeed = easing.Interpolate(actorFastSpeed, actorMinFastSpeed, actorMaxMass, a.Mass, actorSpeedEasing)
			}

		} else {
			a.Fast = false
		}

		a.fastTimeValue = easing.Interpolate(actorMaxFastTime, actorMinFastTime, actorMaxMass, a.Mass, actorFastTimeEasing)
		a.dirty = true
	}
}

func (a *Actor) setFastTime(delta float64) {
	if a.fastPenalty > 0 {
		a.fastPenalty -= delta
	}

	if a.Fast && a.fastTime > 0 {
		a.fastTime -= delta
	} else if !a.Fast && a.fastTime < a.fastTimeValue {
		penalty := 0.2
		if a.Mass <= actorMaxMass {
			penalty = easing.Interpolate(1, 0.2, actorMaxMass, a.Mass, actorFastTimeEasing)
		}
		a.fastTime += delta * penalty
	}

	if a.Fast && a.fastTime <= 0 {
		a.fastPenalty = actorFastPenalty
		a.SetFast(false)
	}
}

func (a *Actor) SetFire(v bool) {
	a.Fire = v
}

func (a *Actor) SetFirePepper(v bool) {
	a.FirePepper = v
}

func (a *Actor) SetForce(f float64) {
	f = f / 10
	if f != a.Force {
		a.Force = f
		a.dirty = true
	}
}

func (a *Actor) SetAngle(angle float64) {
	if angle != a.Angle {
		a.Angle = angle
		a.dirty = true
	}
}

func (a *Actor) SetSlow(v bool) {
	if v != a.Slow {
		a.Slow = v
		a.dirty = true
	}
}

func (a *Actor) SetMass(m float64) {
	if m != a.Mass {
		if m < actorMinMass {
			m = actorMinMass
		}

		a.Mass = m
		a.RadiusTarget = CalculateActorRadius(a.Mass)

		if a.Stats() != nil {
			if a.Mass > a.Stats().MaxMass() {
				a.Stats().SetMaxMass(a.Mass)
			}
		}
	}
}

func (a *Actor) Stats() *GameStats {
	if a.IsBot() {
		return nil
	}

	return a.Conn.Stats
}

func (a *Actor) Speed() float64 {
	var speed float64
	if a.Mass >= actorMaxMass {
		speed = actorMinSpeed
	} else {
		speed = easing.Interpolate(actorSpeedC, actorMinSpeed, actorMaxMass, a.Mass, actorSpeedEasing)
	}

	if a.Fast {
		//todo, check this, it's duplicated in checkVectorSpeed
		speed += a.fastSpeed
	} else if a.pepperBoost <= 0 {
		speed *= a.Force
	}

	boost := 1.0
	if a.Crazy {
		if a.Mass >= actorMaxMass {
			boost += 0.2
		} else {
			boost += easing.Interpolate(0.6, 0.2, actorMaxMass, a.Mass, actorCrazySpeedEasing)
		}
	}

	if a.Slow {
		return speed * 0.6 * boost
	}

	return speed * boost
}

func (a *Actor) GetGeneratedFoodNum(medicine bool) float64 {
	if medicine {
		if a.IsBot() {
			return math.Min(math.Ceil(rand.Float64()*7)+easing.Interpolate(2, 15, actorMaxMassRelativeRadius*0.5+actorMaxMassRelativeRadius, a.Mass, easing.InQuart()), 22)
		}

		return math.Min(math.Ceil(rand.Float64()*15)+easing.Interpolate(5, 30, actorMaxMassRelativeRadius*0.5+actorMaxMassRelativeRadius, a.Mass, easing.InQuart()), 45)
	}

	if a.IsBot() {
		return math.Min(math.Ceil(rand.Float64()*3)+easing.Interpolate(1, 9, actorMaxMassRelativeRadius*0.5+actorMaxMassRelativeRadius, a.Mass, easing.InQuad()), 12)
	}

	return math.Min(math.Ceil(rand.Float64()*3)+easing.Interpolate(3, 18, actorMaxMassRelativeRadius*0.5+actorMaxMassRelativeRadius, a.Mass, easing.InQuad()), 20)
}

func (a *Actor) GetPlayerTime() float64 {
	if a.IsBot() {
		return 0
	}

	return a.Conn.Time
}

func CalculateActorRadius(m float64) float64 {
	if m > actorMaxMassRelativeRadius {
		return actorMaxRadius
	}

	return easing.Interpolate(actorMinRadius, actorMaxRadius, actorMaxMassRelativeRadius, m, actorRadiusEasing)
}

type ActorData struct {
	Id                        int
	Type                      EntityType
	Name                      string
	BuffName                  []byte
	Multi                     float64
	X, Y, Radius, Mass, Crazy float64
	Peppers                   int
	Flags                     int
	Skin                      []byte
	FastPercent               int
}

func (d *ActorData) GetCreateBuffer() []byte {
	buff := []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(ENTITY_TYPE_ACTOR),
	}

	buff = append(buff, d.BuffName...)
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)
	m := int(d.Mass)
	c := int(d.Crazy)

	buff = append(
		buff,

		byte(x>>8&0xff),
		byte(x>>0&0xff),

		byte(y>>8&0xff),
		byte(y>>0&0xff),

		byte(r>>8&0xff),
		byte(r>>0&0xff),

		byte(m>>24&0xff),
		byte(m>>16&0xff),
		byte(m>>8&0xff),
		byte(m>>0&0xff),

		byte(d.Flags>>8&0xff),
		byte(d.Flags>>0&0xff),

		byte(c>>8&0xff),
		byte(c>>0&0xff),

		byte(d.Peppers),

		byte(d.FastPercent),
	)

	buff = append(buff, d.Skin...)

	/*for _, v := range d.Skin {
		buff = append(buff, byte(v))
	}*/

	return buff
}

func (d *ActorData) GetUpdateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)
	m := int(d.Mass)
	c := int(d.Crazy)

	buff := []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),

		byte(r >> 8 & 0xff),
		byte(r >> 0 & 0xff),

		byte(m >> 24 & 0xff),
		byte(m >> 16 & 0xff),
		byte(m >> 8 & 0xff),
		byte(m >> 0 & 0xff),

		byte(d.Flags >> 8 & 0xff),
		byte(d.Flags >> 0 & 0xff),

		byte(c >> 8 & 0xff),
		byte(c >> 0 & 0xff),

		byte(d.Peppers),

		byte(d.FastPercent),
	}

	return buff
}

func (d *ActorData) Copy() ActorData {
	return ActorData{
		Id:          d.Id,
		Type:        d.Type,
		Name:        d.Name,
		BuffName:    d.BuffName,
		X:           d.X,
		Y:           d.Y,
		Radius:      d.Radius,
		Mass:        d.Mass,
		Crazy:       d.Crazy,
		Flags:       d.Flags,
		Multi:       d.Multi,
		Peppers:     d.Peppers,
		FastPercent: d.FastPercent,
		Skin:        d.Skin, //todo iterate to copy
	}
}

func (d *ActorData) ShouldUpdate(d2 *ActorData) bool {
	return (d.X != d2.X || d.Y != d2.Y || d.Radius != d2.Radius || d.Mass != d2.Mass || d.Crazy != d2.Crazy || d.Flags != d2.Flags)
}

type ActorDataNoSkin struct {
	Id                        int
	Type                      EntityType
	Name                      string
	Multi                     float64
	Peppers                   int
	X, Y, Radius, Mass, Crazy float64
	Flags                     int
	FastPercent               int
}

func (d *ActorData) ToNoSkin() ActorDataNoSkin {
	return ActorDataNoSkin{
		Id:          d.Id,
		Type:        d.Type,
		Name:        d.Name,
		X:           d.X,
		Y:           d.Y,
		Radius:      d.Radius,
		Mass:        d.Mass,
		Crazy:       d.Crazy,
		Flags:       d.Flags,
		Multi:       d.Multi,
		Peppers:     d.Peppers,
		FastPercent: d.FastPercent,
	}
}

type ActorSlice []*Actor

func (s ActorSlice) Len() int {
	return len(s)
}

func (s ActorSlice) Less(i, j int) bool {
	return s[i].Mass > s[j].Mass
}

func (s ActorSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

type InputInfo struct {
	Angle float64
	Force float64
	Flags byte
}
