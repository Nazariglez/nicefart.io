/**
 * Created by nazarigonzalez on 27/10/16.
 */

package game

import (
	"gopkg.in/nazariglez/go-easing.v0"
	"gopkg.in/nazariglez/go-rbush.v0"
	"math"
)

const (
	fartShootTotalTime  = 0.7
	fartPepperTotalTime = 0.5

	fartShootExpireTime            = 6
	fartShootMinRadius             = 11
	fartShootMaxRadius             = 60
	fartShootMaxMassRelativeRadius = 350
)

var (
	fartShootRadiusEasing = easing.OutExpo()
	fartShootSpeedEasing  = easing.Linear()
)

type FartShoot struct {
	State EntityState

	Id                         int
	Mass, Angle, Radius, Speed float64

	Box      *rbush.Box
	Position *Point

	Data *FartShootData

	OnExpire func(f *FartShoot)

	Owner *Actor
	Type  FartType

	vectorSpeed   *Point
	decreaseSpeed float64

	elapsed, cosX, sinY float64
	onMovement          bool
}

func NewEntityFartShoot() *FartShoot {
	box := rbush.Box{}

	return &FartShoot{
		Id:       -1,
		State:    STATE_ALIVE,
		Box:      &box,
		Position: &Point{},
		Data:     &FartShootData{},

		vectorSpeed: &Point{},

		onMovement: true,
	}
}

func (f *FartShoot) Initialize(id int, mass float64, fartType FartType) {
	f.Id = id
	f.Box.Data = id
	f.Type = fartType

	if mass == 0 {
		f.SetMass(1)
	} else {
		f.SetMass(mass)
	}
}

func (f *FartShoot) Reset() {
	f.Id = -1
	f.SetMass(0)
	f.Box.MinX = 0
	f.Box.MinY = 0
	f.Box.MaxX = 0
	f.Box.MaxY = 0
	f.Box.Data = -1
	f.State = STATE_ALIVE
	f.Angle = 0
	f.Speed = 0
	f.Position.Set(0, 0)
	f.vectorSpeed.Set(0, 0)
	f.decreaseSpeed = 0
	f.onMovement = true
	f.elapsed = 0
	f.cosX = 0
	f.sinY = 0
	f.Owner = nil
}

func (f *FartShoot) IsSafeFor(a *Actor) bool {
	return f.onMovement && a == f.Owner
}

func (f *FartShoot) SetDestination(owner *Actor, x, y, speed, angle float64) {
	f.Owner = owner
	f.Position.Set(x, y)

	speedRange := easing.Interpolate(0.3, 0, 600, f.Owner.Radius, easing.Linear())
	if f.Type == FART_TYPE_PEPPER {
		f.Speed = speed + 700 + (f.Owner.Radius * (1.7 + speedRange) / (fartShootTotalTime - 0.1))
	} else {
		f.Speed = speed + 500 + (f.Owner.Radius * (1.7 + speedRange) / (fartShootTotalTime - 0.1))
	}

	f.Angle = angle
	f.cosX = math.Cos(f.Angle)
	f.sinY = math.Sin(f.Angle)
}

func (f *FartShoot) Update(delta float64) {
	if f.elapsed < fartShootTotalTime {
		var speed float64
		if f.Type == FART_TYPE_NORMAL {
			speed = easing.Interpolate(f.Speed, 0, fartShootTotalTime, f.elapsed, fartShootSpeedEasing)
		} else {
			speed = easing.Interpolate(f.Speed, 0, fartPepperTotalTime, f.elapsed, fartShootSpeedEasing)
		}

		if speed < 0 {
			speed = 0
		}

		f.Position.X += (speed * f.cosX) * delta
		f.Position.Y += (speed * f.sinY) * delta
	} else if f.onMovement {
		f.onMovement = false
	}

	if f.elapsed >= fartShootExpireTime {
		f.OnExpire(f)
	}

	f.elapsed += delta
}

func (f *FartShoot) SetMass(m float64) {
	if m != f.Mass {
		f.Mass = m
		f.Radius = CalculateFartShootRadius(f.Mass)
	}
}

func (f *FartShoot) UpdateBox() {
	f.Box.MinX = f.Position.X - f.Radius
	f.Box.MinY = f.Position.Y - f.Radius
	f.Box.MaxX = f.Position.X + f.Radius
	f.Box.MaxY = f.Position.Y + f.Radius
}

func (f *FartShoot) ToData() *FartShootData {
	f.Data.Id = f.Id
	f.Data.Type = ENTITY_TYPE_FART_SHOOT
	f.Data.X = math.Floor(f.Position.X)
	f.Data.Y = math.Floor(f.Position.Y)
	f.Data.Radius = math.Floor(f.Radius)
	f.Data.Mass = math.Floor(f.Mass)
	f.Data.Owner = f.Owner.Id
	f.Data.FartType = f.Type
	return f.Data
}

func CalculateFartShootRadius(m float64) float64 {
	if m > fartShootMaxMassRelativeRadius {
		return fartShootMaxRadius
	}

	return easing.Interpolate(fartShootMinRadius, fartShootMaxRadius, fartShootMaxMassRelativeRadius, m, fartShootRadiusEasing)
}

type FartShootData struct {
	Id                 int
	Type               EntityType
	X, Y, Radius, Mass float64

	Owner    int
	FartType FartType
}

func (d *FartShootData) GetCreateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)
	m := int(d.Mass)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(ENTITY_TYPE_FART_SHOOT),

		byte(m >> 8 & 0xff),
		byte(m >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),

		byte(r >> 8 & 0xff),
		byte(r >> 0 & 0xff),

		byte(d.Owner >> 8 & 0xff),
		byte(d.Owner >> 0 & 0xff),

		byte(d.FartType),
	}
}

func (d *FartShootData) GetUpdateBuffer() []byte {
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

func (d *FartShootData) Copy() FartShootData {
	return FartShootData{
		Id:       d.Id,
		Type:     d.Type,
		X:        d.X,
		Y:        d.Y,
		Radius:   d.Radius,
		Mass:     d.Mass,
		Owner:    d.Owner,
		FartType: d.FartType,
	}
}

func (d *FartShootData) ShouldUpdate(d2 *FartShootData) bool {
	return d.X != d2.X || d.Y != d2.Y
}
