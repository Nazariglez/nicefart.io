/**
 * Created by nazarigonzalez on 14/10/16.
 */

package game

type EntityState int
type PoolReq int
type EntityType int

const (
	ENTITY_TYPE_ACTOR EntityType = iota
	ENTITY_TYPE_FART_SHOOT
	ENTITY_TYPE_MEDICINE
	ENTITY_TYPE_FOOD
	ENTITY_TYPE_POWER_UP
	ENTITY_TYPE_MISC
)

const (
	STATE_ALIVE EntityState = iota
	STATE_DEAD
	STATE_BORN
)

const (
	ENTITY_BUFFER_ACTOR       = 500
	ENTITY_BUFFER_FOOD        = 2000
	ENTITY_BUFFER_POWER_UP    = 300
	ENTITY_BUFFER_FART_SHOOTS = 500
	ENTITY_BUFFER_MEDICINE    = 30
)

type EntitiyPool struct {
	actors     []*Actor
	foods      []*Food
	powerUps   []*PowerUp
	fartShoots []*FartShoot
	medicines  []*Medicine
}

func GetEntityPool() *EntitiyPool {
	buff := &EntitiyPool{}
	buff.CheckBuffers()
	return buff
}

func (b *EntitiyPool) AllocActor() *Actor {
	if len(b.actors) == 0 {
		return NewEntityActor()
	}

	a := b.actors[0]
	b.actors[0] = nil
	b.actors = b.actors[1:]
	return a
}

func (b *EntitiyPool) AllocFood() *Food {
	if len(b.foods) == 0 {
		return NewEntityFood()
	}

	f := b.foods[0]
	b.foods[0] = nil
	b.foods = b.foods[1:]
	return f
}

func (b *EntitiyPool) AllocPowerUp() *PowerUp {
	if len(b.powerUps) == 0 {
		return NewEntityPowerUp()
	}

	c := b.powerUps[0]
	b.powerUps[0] = nil
	b.powerUps = b.powerUps[1:]
	return c
}

func (b *EntitiyPool) AllocFartShoot() *FartShoot {
	if len(b.fartShoots) == 0 {
		return NewEntityFartShoot()
	}

	f := b.fartShoots[0]
	b.fartShoots[0] = nil
	b.fartShoots = b.fartShoots[1:]
	return f
}

func (b *EntitiyPool) AllocMedicine() *Medicine {
	if len(b.medicines) == 0 {
		return NewEntityMedicine()
	}

	m := b.medicines[0]
	b.medicines[0] = nil
	b.medicines = b.medicines[1:]
	return m
}

func (b *EntitiyPool) Free(entity interface{}) {
	switch e := entity.(type) {
	case *Actor:
		e.Reset()
		b.actors = append(b.actors, e)
	case *Food:
		e.Reset()
		b.foods = append(b.foods, e)
	case *PowerUp:
		e.Reset()
		b.powerUps = append(b.powerUps, e)
	case *FartShoot:
		e.Reset()
		b.fartShoots = append(b.fartShoots, e)
	case *Medicine:
		e.Reset()
		b.medicines = append(b.medicines, e)
	}
}

func (b *EntitiyPool) Len(t EntityType) int {
	switch t {
	case ENTITY_TYPE_ACTOR:
		return len(b.actors)
	case ENTITY_TYPE_FOOD:
		return len(b.foods)
	case ENTITY_TYPE_POWER_UP:
		return len(b.powerUps)
	case ENTITY_TYPE_FART_SHOOT:
		return len(b.fartShoots)
	case ENTITY_TYPE_MEDICINE:
		return len(b.medicines)
	}

	return 0
}

func (b *EntitiyPool) CheckBuffers() {
	if len(b.actors) < ENTITY_BUFFER_ACTOR {
		for i := len(b.actors) - 1; i < ENTITY_BUFFER_ACTOR; i++ {
			b.actors = append(b.actors, NewEntityActor())
		}
	}

	if len(b.foods) < ENTITY_BUFFER_FOOD {
		for i := len(b.foods) - 1; i < ENTITY_BUFFER_FOOD; i++ {
			b.foods = append(b.foods, NewEntityFood())
		}
	}

	if len(b.powerUps) < ENTITY_BUFFER_POWER_UP {
		for i := len(b.powerUps) - 1; i < ENTITY_BUFFER_POWER_UP; i++ {
			b.powerUps = append(b.powerUps, NewEntityPowerUp())
		}
	}

	if len(b.fartShoots) < ENTITY_BUFFER_FART_SHOOTS {
		for i := len(b.fartShoots) - 1; i < ENTITY_BUFFER_FART_SHOOTS; i++ {
			b.fartShoots = append(b.fartShoots, NewEntityFartShoot())
		}
	}

	if len(b.medicines) < ENTITY_BUFFER_MEDICINE {
		for i := len(b.medicines) - 1; i < ENTITY_BUFFER_MEDICINE; i++ {
			b.medicines = append(b.medicines, NewEntityMedicine())
		}
	}
}
