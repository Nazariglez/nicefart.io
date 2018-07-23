/**
 * Created by nazarigonzalez on 26/10/16.
 */

package game

import (
	"math"
	"math/rand"

	"gopkg.in/nazariglez/go-rbush.v0"

	"../utils"
)

type PowerType byte

const (
	powerUpPillSpeedMin = 400
	powerUpPillSpeedMax = 750
	powerUpPillRadius   = 32
)

const (
	POWER_UP_CRAZY PowerType = iota
	POWER_UP_PEPPER
	POWER_UP_MULTI2
	POWER_UP_MULTI3
)

type PowerUp struct {
	State EntityState

	PowerType PowerType

	Id                   int
	Position             *Point
	Radius, Angle, Speed float64

	Box  *rbush.Box
	Data *PowerUpData

	vectorSpeed         *Point
	changeMovementTimer float64
}

func NewEntityPowerUp() *PowerUp {
	box := rbush.Box{}

	return &PowerUp{
		Id:        -1,
		State:     STATE_BORN,
		Box:       &box,
		Position:  &Point{},
		Data:      &PowerUpData{},
		Radius:    powerUpPillRadius,
		PowerType: POWER_UP_CRAZY,

		vectorSpeed: &Point{},
	}
}

func (p *PowerUp) Initialize(id int, angle, speed float64, pwType PowerType) {
	p.Id = id
	p.Box.Data = id
	p.PowerType = pwType

	if angle != 0 {
		p.Speed = speed
		p.Angle = angle
		p.changeMovementTimer = 1
		p.calcSpeed()
	} else {
		p.setRandomParams()
	}
}

func (p *PowerUp) Reset() {
	p.State = STATE_BORN
	p.Speed = 0
	p.Angle = 0
	p.vectorSpeed.Set(0, 0)
	p.Position.Set(0, 0)
	p.changeMovementTimer = 0
	p.Radius = powerUpPillRadius
	p.Id = -1
	p.Box.MinX = 0
	p.Box.MinY = 0
	p.Box.MaxX = 0
	p.Box.MaxY = 0
	p.Box.Data = -1
}

func (p *PowerUp) UpdateBox() {
	p.Box.MinX = p.Position.X - p.Radius
	p.Box.MinY = p.Position.Y - p.Radius
	p.Box.MaxX = p.Position.X + p.Radius
	p.Box.MaxY = p.Position.Y + p.Radius
}

func (p *PowerUp) FixPosition(delta, x, y float64) {
	change := false

	if p.Position.X < -x {
		p.Position.X = -x
		change = true
	} else if p.Position.X > x {
		p.Position.X = x
		change = true
	}

	if p.Position.Y < -y {
		p.Position.Y = -y
		change = true
	} else if p.Position.Y > y {
		p.Position.Y = y
		change = true
	}

	if change {
		p.setRandomParams()
	}
}

func (p *PowerUp) setRandomParams() {
	if p.State == STATE_BORN {
		p.State = STATE_ALIVE
	}

	p.Angle = math.Floor(rand.Float64()*360) * utils.DEG_TO_RAD
	p.Speed = powerUpPillSpeedMin + math.Floor(rand.Float64()*(powerUpPillSpeedMax-powerUpPillSpeedMin))
	p.changeMovementTimer = 1 + rand.Float64()*3
	p.calcSpeed()
}

func (p *PowerUp) calcSpeed() {
	cosX := math.Cos(p.Angle)
	sinY := math.Sin(p.Angle)

	p.vectorSpeed.Set(
		p.Speed*cosX,
		p.Speed*sinY,
	)
}

func (p *PowerUp) ToData() *PowerUpData {
	p.Data.Id = p.Id
	p.Data.Type = ENTITY_TYPE_POWER_UP
	p.Data.X = math.Floor(p.Position.X)
	p.Data.Y = math.Floor(p.Position.Y)
	p.Data.Radius = p.Radius
	p.Data.PowerType = p.PowerType
	return p.Data
}

func (p *PowerUp) Update(delta float64) {
	p.Position.X += p.vectorSpeed.X * delta
	p.Position.Y += p.vectorSpeed.Y * delta

	p.changeMovementTimer -= delta
	if p.changeMovementTimer <= 0 {
		p.setRandomParams()
	}
}

type PowerUpData struct {
	Id           int
	Type         EntityType
	X, Y, Radius float64

	PowerType PowerType
}

func (d *PowerUpData) GetCreateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(ENTITY_TYPE_POWER_UP),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),

		byte(r >> 8 & 0xff),
		byte(r >> 0 & 0xff),

		byte(d.PowerType),
	}
}

func (d *PowerUpData) GetUpdateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),
	}
}

func (d *PowerUpData) Copy() PowerUpData {
	return PowerUpData{
		Id:        d.Id,
		Type:      d.Type,
		X:         d.X,
		Y:         d.Y,
		Radius:    d.Radius,
		PowerType: d.PowerType,
	}
}

func (d *PowerUpData) ShouldUpdate(d2 *PowerUpData) bool {
	return d.X != d2.X || d.Y != d2.Y
}
