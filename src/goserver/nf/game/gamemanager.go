/**
 * Created by nazarigonzalez on 12/10/16.
 */

package game

import (
	"github.com/gorilla/websocket"

	"../logger"
	"../utils"
	"encoding/json"
	"io/ioutil"
	"path"
)

var GAMES_LIMIT = 1 //runtime.NumCPU() //todo untested, maybe has some race conditions?

type SkinsFile struct {
	Skins utils.SkinsInfo `json:"skins"`
}

type ConnMessage struct {
	id  byte
	msg []byte
	ws  *WSConnection
}

var connections = []*WSConnection{}
var games = []*Game{}
var gm = make(chan ConnMessage, 10000)
var initiated = false

func InitGameManager(configPath string) {
	if initiated {
		logger.Warn("GameManager already initiated...")
		return
	}

	initiated = true

	f, err := ioutil.ReadFile(path.Join(configPath, "config.json"))
	if err != nil {
		logger.Fatal(err)
		return
	}

	var i SkinsFile
	json.Unmarshal(f, &i)

	if err := utils.InitializeSkins(i.Skins); err != nil {
		logger.Fatal(err)
	}

	for i := 0; i < GAMES_LIMIT; i++ {
		games = append(games, NewGame(i+1))
	}

	logger.Infof("Created %d games.\n", GAMES_LIMIT)

	go ReadMessages()
}

func NewConnection(c *websocket.Conn) {
	newWebsocketConnection(c, gm)
}

func ReadMessages() {
	for g := range gm {
		switch g.id {
		case MSG_ID_INIT:
			OnPlayerInit(g.ws)
		case MSG_ID_INPUT:
			OnPlayerInput(g.ws, g.msg)
		case MSG_ID_CLOSE:
			OnPlayerClose(g.ws)
		}
	}
}

func OnPlayerInit(ws *WSConnection) {
	logger.Debugf("Game manager player to init. Payload: %+v", ws.ClientData)
	connections = append(connections, ws)

	/*added := false //Important: use this if we have more than one room by instance
	l := len(games)
	for i := 0; i < l; i++ {
		if games[i].PlayersLen() < PLAYER_LIMIT {
			logger.Debugf("Sendind game event to add player to game: %s", i)
			games[i].AddEvent(GAME_EVENT_ADD_PLAYER, ws)
			added = true
			break
		}
	}

	if !added {
		logger.Warn("All games are bussy")

		if i := indexOfLessBusyGame(); i != -1 {
			logger.Debug("Added player to a busy game...")
			games[i].AddEvent(GAME_EVENT_ADD_PLAYER, ws)
		} else {
			//this never will happend (theorically)
			logger.Error("- WARNING PLAYER KICKED BY SYSTEM. No one server is available...")
			ws.kill()
		}
	}*/

	//Important: use the first and unique server
	logger.Debugf("Sendind game event to add player to game: %d", games[0].Id)
	games[0].AddEvent(GAME_EVENT_ADD_PLAYER, ws)
}

func OnPlayerInput(ws *WSConnection, msg []byte) {
	if ws.Actor == nil {
		return
	}

	//illegal length
	if len(msg) != 4 {
		ws.kill()
		return
	}

	angle := utils.IntFromInt16Buffer(msg[:2])
	angle -= (angle / 360) * 360
	force := float64(msg[2])

	if force < 0 {
		force = 0
	} else if force > 10 {
		force = 10
	}

	ws.Actor.SetInput(msg[3], float64(angle)*utils.DEG_TO_RAD, force)
}

func OnPlayerClose(ws *WSConnection) {
	logger.Debugf("Game manager player closed. Payload: %+v", ws.ClientData)
	if i := indexOfConnection(ws); i != -1 {
		connections[i] = nil
		connections = append(connections[:i], connections[i+1:]...)
	}

	llen := len(games)
	for i := 0; i < llen; i++ {
		logger.Debugf("Sending remove player event to the game: %d", games[i].Id)
		games[i].AddEvent(GAME_EVENT_REMOVE_PLAYER, ws)
	}
}

func indexOfConnection(ws *WSConnection) int {
	index := -1
	for n, v := range connections {
		if v == ws {
			index = n
			break
		}
	}

	return index
}

func indexOfLessBusyGame() int {
	offset := 8
	l := len(games)
	max := 15000
	i := -1

	var p int
	for n := 0; n < l; n++ {

		p = games[n].PlayersLen() / offset
		if p < max {
			max = p
			i = n
		}
	}

	return i
}
