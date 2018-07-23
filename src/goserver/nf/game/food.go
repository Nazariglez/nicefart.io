/**
 * Created by nazarigonzalez on 17/10/16.
 */

package game

import (
	"../utils"
	"gopkg.in/nazariglez/go-easing.v0"
	"gopkg.in/nazariglez/go-rbush.v0"
	"math"
	"math/rand"
)

const (
	rad55                     = 55 * utils.DEG_TO_RAD
	foodOutTime               = 5.5
	foodMinRadius             = 31
	foodMaxRadius             = 80
	foodMaxMassRelativeRadius = 410
)

var (
	foodRadiusEasing = easing.OutExpo()
)

type Food struct {
	State EntityState

	Id                         int
	Mass, Angle, Radius, Speed float64

	Box      *rbush.Box
	Position *Point

	Data *FoodData

	OnExpireOut func(f *Food)

	vectorSpeed            *Point
	decreaseSpeed, outTime float64
	out                    bool
}

func NewEntityFood() *Food {
	box := rbush.Box{}

	return &Food{
		Id:       -1,
		State:    STATE_ALIVE,
		Box:      &box,
		Position: &Point{},
		Data:     &FoodData{},

		vectorSpeed: &Point{},

		outTime: foodOutTime,
	}
}

func (f *Food) Initialize(id int, mass float64) {
	f.Id = id
	f.Box.Data = id

	if mass == 0 {
		f.SetMass(1)
	} else {
		f.SetMass(mass)
	}
}

func (f *Food) Reset() {
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
	f.out = false
	f.decreaseSpeed = 0
	f.outTime = foodOutTime
}

func (f *Food) SetMass(m float64) {
	if m != f.Mass {
		f.Mass = m
		f.Radius = CalculateFoodRadius(f.Mass)
	}
}

func (f *Food) SetSpeed(v float64) {
	if v != f.Speed {
		cosX := math.Cos(f.Angle)
		sinY := math.Sin(f.Angle)

		f.vectorSpeed.Set(
			v*cosX,
			v*sinY,
		)

		f.Speed = v
	}
}

func (f *Food) SetMovement(angle, speed float64) {
	min := -rad55 + angle

	f.State = STATE_BORN
	f.Angle = min + (rand.Float64() * (rad55 * 2))
	f.SetSpeed(speed + easing.Interpolate(0, 50, foodMaxMassRelativeRadius, f.Mass, easing.Linear()))
	f.decreaseSpeed = speed * 0.8
}

func (f *Food) Update(delta float64) {
	if f.State == STATE_BORN {
		if f.Speed <= 20 {
			f.State = STATE_ALIVE
		}
	}

	if f.Speed > 0 {
		f.Position.X += f.vectorSpeed.X * delta
		f.Position.Y += f.vectorSpeed.Y * delta

		f.SetSpeed(f.Speed - f.decreaseSpeed*delta)
	}

	if f.out {
		f.outTime -= delta
		if f.outTime <= 0 && f.State == STATE_ALIVE {
			f.OnExpireOut(f)
		}
	}
}

func (f *Food) FixPosition(delta, x, y float64) {
	if f.out {
		return
	}

	if f.Position.X < -x || f.Position.X > x || f.Position.Y < -y || f.Position.Y > y {
		f.out = true
	}
}

func (f *Food) UpdateBox() {
	f.Box.MinX = f.Position.X - f.Radius
	f.Box.MinY = f.Position.Y - f.Radius
	f.Box.MaxX = f.Position.X + f.Radius
	f.Box.MaxY = f.Position.Y + f.Radius
}

func (f *Food) ToData() *FoodData {
	f.Data.Id = f.Id
	f.Data.Type = ENTITY_TYPE_FOOD
	f.Data.X = math.Floor(f.Position.X)
	f.Data.Y = math.Floor(f.Position.Y)
	f.Data.Radius = math.Floor(f.Radius)
	f.Data.Mass = math.Floor(f.Mass)
	return f.Data
}

func CalculateFoodRadius(m float64) float64 {
	if m == 1 {
		return 22
	} else if m > foodMaxMassRelativeRadius {
		return foodMaxRadius
	}

	return easing.Interpolate(foodMinRadius, foodMaxRadius, foodMaxMassRelativeRadius, m, foodRadiusEasing)
}

type FoodData struct {
	Id                 int
	Type               EntityType
	X, Y, Radius, Mass float64
}

func (d *FoodData) GetCreateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)
	m := int(d.Mass)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(ENTITY_TYPE_FOOD),

		byte(m >> 8 & 0xff),
		byte(m >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),

		byte(r >> 8 & 0xff),
		byte(r >> 0 & 0xff),
	}
}

func (d *FoodData) GetUpdateBuffer() []byte {
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

func (d *FoodData) Copy() FoodData {
	return FoodData{
		Id:     d.Id,
		Type:   d.Type,
		X:      d.X,
		Y:      d.Y,
		Radius: d.Radius,
		Mass:   d.Mass,
	}
}

func (d *FoodData) ShouldUpdate(d2 *FoodData) bool {
	return d.X != d2.X || d.Y != d2.Y
}
