/**
 * Created by nazarigonzalez on 31/10/16.
 */

package game

import (
	"math/rand"
)

type BrainState int
type BrainType int

const (
	BRAIN_STATE_SEARCH_FOOD BrainState = iota
	BRAIN_STATE_KILLING
	BRAIN_STATE_RUN_AWAY
	BRAIN_STATE_MEDICINE
)

const (
	BRAIN_TYPE_SCAVENGER BrainType = iota
	BRAIN_TYPE_NORMAL
)

type BotBrain struct {
	State BrainState
	Type  BrainType

	Target      *Actor
	Value, Time float64
}

func NewBotBrain() *BotBrain {
	return &BotBrain{
		Target: nil,
		State:  BRAIN_STATE_SEARCH_FOOD,
		Type:   BRAIN_TYPE_NORMAL,
		Value:  0,
		Time:   0,
	}
}

func (b *BotBrain) Reset() {
	b.Target = nil
	b.State = BRAIN_STATE_SEARCH_FOOD
	b.Value = rand.Float64()
	b.Time = -1

	if rand.Float64() < 0.08 {
		b.Type = BRAIN_TYPE_SCAVENGER
	} else {
		b.Type = BRAIN_TYPE_NORMAL
	}
}
