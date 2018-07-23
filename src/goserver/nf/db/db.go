// Created by nazarigonzalez on 9/2/17.

package db

import (
	"fmt"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"

	"../logger"
)

var _db *gorm.DB

var devDB = DBConfig{
	Name:   "nicefart",
	User:   "root",
	Params: "charset=utf8&parseTime=True&loc=Local",
}

var prodDB = DBConfig{
	Name:     "nicefart",
	User:     "-",
	Password: "megapassword",
	Params:   "charset=utf8&parseTime=True&loc=Local",
	Host:     "nicefart.io:3366",
	//Protocol: "unix",
}

func Init(production bool) error {
	if production {
		addDatabase(prodDB)
	} else {
		addDatabase(devDB)
	}

	logger.Debug("Connecting to the db...")
	db, err := connectToDB("nicefart")
	if err != nil {
		return err
	}

	db.DB().SetMaxIdleConns(10)
	db.DB().SetMaxOpenConns(100)

	_db = db
	_db.LogMode(false)

	return createTables()
}

func DB() *gorm.DB {
	return _db
}

func createTables() error {
	logger.Debug("Checking db tables...")
	if err := _db.AutoMigrate(&User{}).Error; err != nil {
		return err
	}

	if err := _db.AutoMigrate(&Game{}).Error; err != nil {
		return err
	}

	return nil
}

func Close() {
	_db.Close()
}

type DBConfig struct {
	User     string
	Password string
	Protocol string
	Host     string
	Name     string
	Params   string
}

var databases map[string]DBConfig

func addDatabase(config DBConfig) error {
	if databases == nil {
		databases = make(map[string]DBConfig)
	}

	if config.Name == "" {
		return fmt.Errorf("%s", "Invalid name")
	}

	if config.User == "" {
		return fmt.Errorf("%s", "Invalid user")
	}

	if config.Protocol == "" {
		config.Protocol = "tcp"
	}
	if config.Host == "" {
		config.Host = "localhost:3306"
	}

	databases[config.Name] = config

	return nil
}

func connectToDB(name string) (*gorm.DB, error) {
	config, ok := databases[name]
	if !ok {
		return nil, fmt.Errorf("%s", "Invalid database")
	}

	data := fmt.Sprintf("%s:%s@%s(%s)/%s", config.User, config.Password, config.Protocol, config.Host, config.Name)
	if config.Params != "" {
		data += "?" + config.Params
	}

	db, err := gorm.Open("mysql", data)
	if err != nil {
		return nil, err
	}

	if err := db.DB().Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
