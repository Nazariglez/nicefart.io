// Created by nazarigonzalez on 11/2/17.

package db

import (
	"github.com/jinzhu/gorm"
	"time"
)

type Room struct {
	gorm.Model

	Date            time.Time
	PlayerNum       int
	ActorNum        int
	FoodNum         int
	MapSize         int
	LoopTime        int
	WorldUpdateTime int
	GameTime        int
	BytesInAvg      int
	BytesOutAvg     int
	BytesInTotal    int
	BytesOutTotal   int
}
