// Created by nazarigonzalez on 10/2/17.

package db

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"

	"time"
)

type User struct {
	gorm.Model

	Email     string `gorm:"size:255"`
	Coins     int
	LastLogin time.Time
}
