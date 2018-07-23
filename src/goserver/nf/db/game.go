// Created by nazarigonzalez on 10/2/17.

package db

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"

	"time"
)

type Game struct {
	gorm.Model

	User               User `gorm:"ForeignKey:UserID"`
	UserID             uint
	ServerName         string `gorm:"size:255"`
	Name               string `gorm:"size:255"`
	Skin               string `gorm:"size:255"`
	Costume            string `gorm:"size:255"`
	StartDate          time.Time
	EndDate            time.Time
	GameTime           int64
	MaxMass            int
	FoodEaten          int
	PlayersKilled      int
	BotsKilled         int
	BytesIn            int
	BytesOut           int
	PowerUpStar        int
	PowerUpPepper      int
	PowerUpMulti       int
	FartsFired         int
	FartsTaken         int
	FireFartsFired     int
	FireFartsTaken     int
	DeathBy            int
	OutTime            int
	KillerUser         User `gorm:"ForeignKey:KillerUserID"`
	KillerUserID       uint
	KillerName         string `gorm:"size:255"`
	RunTime            int
	MassLostByFart     int
	MassLostByTime     int
	MassLostByStar     int
	MassLostByDrop     int
	MassLostByFireFart int
	MaxTop             int
	TopTime            int
	MaxMassKilled      int
	Points             int
}
