/**
 * Created by nazarigonzalez on 11/10/16.
 */

package main

import (
	"flag"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/websocket"

	"./nf/core"
	"./nf/db"
	"./nf/game"
	"./nf/logger"
	"./nf/utils"
	"os"
	"path"
	"strconv"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		//todo change this in prod to r.Header.Get("Origin") == "http://nicefart.io"
		return true
	},
}

var (
	randSeed = time.Now().UnixNano()

	coreMode   = flag.Bool("core", false, "Core mode")
	port       = flag.String("port", "", "http port")
	prod       = flag.Bool("prod", false, "Production mode")
	configPath = flag.String("path", "", "Config path")
	logMode    = flag.String("log", "", "Log mode")
)

func main() {
	//runtime.GOMAXPROCS(2) //todo remove
	flag.Parse()
	rand.Seed(randSeed)

	if *configPath == "" {
		ex, err := os.Executable()
		if err != nil {
			log.Fatal(err)
		}

		*configPath = path.Dir(ex)
	}

	initLogs()

	if *prod {
		logger.Info("Production mode enabled.")
	} else {
		logger.Info("Development mode enabled")
	}

	logger.Debug("Connecting to database...")
	if err := db.Init(*prod); err != nil {
		logger.Fatal(err)
	}

	if *coreMode {
		initCoreServer()
	} else {
		initGameServer()
	}
}

func initLogs() {
	if *logMode != "" {

		switch *logMode {
		case "trace":
			logger.SetLevel(logger.TraceLevel)
		case "debug":
			logger.SetLevel(logger.DebugLevel)
		case "info":
			logger.SetLevel(logger.InfoLevel)
		case "warn":
			logger.SetLevel(logger.WarnLevel)
		case "error":
			logger.SetLevel(logger.ErrorLevel)
		}

	} else if *prod {
		logger.SetLevel(logger.InfoLevel)
	} else {
		logger.SetLevel(logger.DebugLevel)
	}

	p := path.Join(*configPath, "logs")
	if _, err := os.Stat(p); os.IsNotExist(err) {
		if err := os.Mkdir(p, 0777); err != nil {
			log.Fatal(err)
		}
	}

	var name string
	if *coreMode {
		name = "core_" + time.Now().Format("2006-01-02_15:04:05")
	} else {
		name = "game_" + time.Now().Format("2006-01-02_15:04:05")
	}

	attempt := 0
	for {
		if _, err := os.Stat(path.Join(p, name, "_"+strconv.Itoa(attempt)+".txt")); os.IsNotExist(err) {
			break
		} else {
			attempt++
		}
	}

	logger.Init(path.Join(p, name+"_"+strconv.Itoa(attempt)+".txt"), "BeanWar.io")
}

func initCoreServer() {
	p := resolvePort(utils.CORE_SERVER_PORT)

	logger.Infof("Core server mode enabled. (Port%s)\n", p)

	core.Init(*prod, p, *configPath)
}

func initGameServer() {
	p := resolvePort(utils.GAME_SERVER_PORT)

	logger.Infof("Game server mode enabled. (Port%s)\n", p)
	game.InitGameManager(*configPath)

	http.HandleFunc("/", wsGameHandler)
	if err := http.ListenAndServe(p, nil); err != nil {
		logger.Fatal(err)
	}
}

func wsGameHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error(err)
		return
	}

	game.NewConnection(conn)
}

func resolvePort(defaultPort string) string {
	if *port != "" {
		return ":" + *port
	}

	return defaultPort
}
