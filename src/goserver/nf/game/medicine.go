/**
 * Created by nazarigonzalez on 29/10/16.
 */

package game

import (
	"../utils"
	"gopkg.in/nazariglez/go-rbush.v0"
	"math"
	"math/rand"
)

const (
	rad180 = math.Pi
	rad    = 2 * math.Pi

	medicineRadarTime      = 1
	medicineSpeedMin       = 50
	medicineSpeedMax       = 130
	medicineTimeToRespawn  = 90
	medicineRadius         = 75
	medicineSearchDistance = 0.25
)

type Medicine struct {
	State EntityState

	Id int

	Speed, Angle, Radius, AngleDir float64

	Position, vectorSpeed *Point

	changeMovementTime        float64
	Target                    *Actor
	targetRadarTime, distance float64
	dirty                     bool

	Box                       *rbush.Box
	MapSize, speedMax         float64
	TimeToRespawn, SearchTime float64

	Data *MedicineData
}

func NewEntityMedicine() *Medicine {
	box := rbush.Box{}

	return &Medicine{
		Id:       -1,
		State:    STATE_BORN,
		Box:      &box,
		Position: &Point{},
		Radius:   medicineRadius,

		Data: &MedicineData{},

		vectorSpeed: &Point{},
	}
}

func (m *Medicine) Initialize(id, mapSize int) {
	m.Id = id
	m.Box.Data = id
	m.MapSize = float64(mapSize)

	m.distance = m.MapSize * medicineSearchDistance
	m.speedMax = medicineSpeedMax + (rand.Float64() * 30)
	m.setRandomParams()
}

func (m *Medicine) Reset() {
	m.Id = -1
	m.MapSize = 0
	m.Radius = medicineRadius
	m.Speed = 0
	m.Angle = 0
	m.AngleDir = 0

	if m.Target != nil {
		m.Target.FindingByMedicine = -1
	}

	m.Target = nil
	m.changeMovementTime = 0
	m.targetRadarTime = 0
	m.dirty = false
	m.distance = 0
	m.TimeToRespawn = 0
	m.SearchTime = 0

	m.vectorSpeed.Set(0, 0)
	m.Position.Set(0, 0)
}

func (m *Medicine) Die() {
	m.State = STATE_DEAD
	m.TimeToRespawn = medicineTimeToRespawn + rand.Float64()*30
}

func (m *Medicine) Update(delta float64) {
	if m.State == STATE_DEAD {
		m.TimeToRespawn -= delta
		return
	}

	m.Position.X += m.vectorSpeed.X * delta
	m.Position.Y += m.vectorSpeed.Y * delta

	if m.Target != nil {
		if m.Target.State == STATE_DEAD || m.Target.Crazy {
			m.Target.FindingByMedicine = -1
			m.Target = nil
			m.setRandomParams()
		} else {
			m.targetRadarTime -= delta

			if m.targetRadarTime <= 0 {
				a := m.Position.X - m.Target.Position.X
				b := m.Position.Y - m.Target.Position.Y

				distance := math.Abs(math.Sqrt(a*a + b*b))

				if distance > m.distance+m.Target.Radius {
					m.Target.FindingByMedicine = -1
					m.Target = nil
					m.setRandomParams()
				} else {
					m.AngleDir = math.Atan2(m.Target.Position.Y-m.Position.Y, m.Target.Position.X-m.Position.X)
				}
			}

		}
	} else {
		m.changeMovementTime -= delta

		if m.changeMovementTime <= 0 {
			m.setRandomParams()
		}
	}

	if m.AngleDir != m.Angle {
		if m.Angle < m.AngleDir {
			m.Angle = math.Mod(m.Angle+rad180*delta, rad)

			if m.Angle < m.AngleDir {
				m.Angle = m.AngleDir
			}
		} else {
			m.Angle = math.Mod(m.Angle-rad180*delta, rad)

			if m.Angle < m.AngleDir {
				m.Angle = m.AngleDir
			}
		}
		m.dirty = true
	}

	if m.dirty {
		m.calcSpeed()
	}

}

func (m *Medicine) UpdateBox() {
	m.Box.MinX = m.Position.X - m.Radius
	m.Box.MinY = m.Position.Y - m.Radius
	m.Box.MaxX = m.Position.X + m.Radius
	m.Box.MaxY = m.Position.Y + m.Radius
}

func (m *Medicine) setRandomParams() {
	if m.State == STATE_BORN {
		m.State = STATE_ALIVE
	}

	m.AngleDir = math.Mod(math.Floor(rand.Float64()*360)*utils.DEG_TO_RAD, rad)
	m.Speed = medicineSpeedMin
	m.changeMovementTime = 3 + rand.Float64()*6
	m.calcSpeed()
}

func (m *Medicine) SetTarget(a *Actor) {
	if m.Target != nil {
		m.Target.FindingByMedicine = -1
	}

	m.targetRadarTime = medicineRadarTime
	m.Target = a
	m.Target.FindingByMedicine = m.Id
	m.Speed = medicineSpeedMax
	m.AngleDir = math.Atan2(m.Target.Position.Y-m.Position.Y, m.Target.Position.X-m.Position.X)
	m.calcSpeed()
}

func (m *Medicine) IsBestTarget(a *Actor) bool {
	if m.Target == nil || m.Target.State == STATE_DEAD || m.Target.Crazy { //todo actor.crazy, why?? it's a bug?
		return true
	}

	return a.Mass > m.Target.Mass
}

func (m *Medicine) FixPosition(delta, x, y float64) {
	change := false

	if m.Position.X < -x {
		m.Position.X = -x
		change = true
	} else if m.Position.X > x {
		m.Position.X = x
		change = true
	}

	if m.Position.Y < -y {
		m.Position.Y = -y
		change = true
	} else if m.Position.Y > y {
		m.Position.Y = y
		change = true
	}

	if change {
		m.setRandomParams()
	}
}

func (m *Medicine) calcSpeed() {
	cosX := math.Cos(m.Angle)
	sinY := math.Sin(m.Angle)

	m.vectorSpeed.Set(
		m.Speed*cosX,
		m.Speed*sinY,
	)

	m.dirty = false
}

func (m *Medicine) ToData() *MedicineData {
	m.Data.Id = m.Id
	m.Data.Type = ENTITY_TYPE_MEDICINE
	m.Data.X = math.Floor(m.Position.X)
	m.Data.Y = math.Floor(m.Position.Y)
	m.Data.Radius = math.Floor(m.Radius)
	m.Data.Angle = math.Floor(m.Angle * utils.RAD_TO_DEG)
	return m.Data
}

type MedicineData struct {
	Id                  int
	Type                EntityType
	Angle, X, Y, Radius float64
}

func (d *MedicineData) GetCreateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	r := int(d.Radius)
	a := int(d.Angle)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(ENTITY_TYPE_MEDICINE),

		byte(a >> 8 & 0xff),
		byte(a >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),

		byte(r >> 8 & 0xff),
		byte(r >> 0 & 0xff),
	}
}

func (d *MedicineData) GetUpdateBuffer() []byte {
	x := int(d.X)
	y := int(d.Y)
	a := int(d.Angle)

	return []byte{
		byte(d.Id >> 8 & 0xff),
		byte(d.Id >> 0 & 0xff),

		byte(a >> 8 & 0xff),
		byte(a >> 0 & 0xff),

		byte(x >> 8 & 0xff),
		byte(x >> 0 & 0xff),

		byte(y >> 8 & 0xff),
		byte(y >> 0 & 0xff),
	}
}

func (d *MedicineData) Copy() MedicineData {
	return MedicineData{
		Id:     d.Id,
		Type:   d.Type,
		Angle:  d.Angle,
		X:      d.X,
		Y:      d.Y,
		Radius: d.Radius,
	}
}

func (d *MedicineData) ShouldUpdate(d2 *MedicineData) bool {
	return d.X != d2.X || d.Y != d2.Y || d.Angle != d2.Angle
}
