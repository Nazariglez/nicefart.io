/**
 * Created by nazarigonzalez on 12/10/16.
 */

package game

import (
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"../logger"
	"../utils"
	"fmt"
)

var msgPool = NewMsgObjPool()
var dummyBuff = []byte{}

//todo sync.Pool -> []byte{}

const (
	MSG_ID_INIT = iota
	MSG_ID_INPUT
	MSG_ID_AUTH
	MSG_ID_WORLD
	MSG_ID_MODE
	MSG_ID_CLOSE
	MSG_ID_RANK
	MSG_ID_RADAR
)

const (
	MSG_STATUS_SUCCESS = iota
	MSG_STATUS_ERROR
	MSG_STATUS_INFO
)

const (
	MSG_ERROR_INVALID_AUTH = iota
)

const (
	TIME_TO_KILL_PLAYER = 4050
	TIME_QUOTA_CHECK    = 2000
	MAX_REQUEST         = 50
)

const (
	UPDATE_CODE_CREATE = iota
	UPDATE_CODE_REMOVE
	UPDATE_CODE_UPDATE
)

const (
	connWriteWait = 1 * time.Second
)

type ConnStatus int

const (
	CONN_STATUS_AUTH ConnStatus = iota
	CONN_STATUS_OPEN
	CONN_STATUS_CLOSED
)

var SERVER_ID string

type WSConnection struct {
	sync.Mutex

	connMsg   *ConnMessage
	GMChan    chan<- ConnMessage
	writeChan chan *MsgObj
	conn      *websocket.Conn
	quota     int
	startDate time.Time
	Stats     *GameStats

	BytesIn, BytesOut int
	Time              float64
	valid             bool
	ClientData        *Payload
	Actor             *Actor

	LastTopPosition int

	Cache map[int]interface{}
	Admin bool

	savedToDB bool

	status ConnStatus
}

func newWebsocketConnection(c *websocket.Conn, gm chan<- ConnMessage) *WSConnection {
	ws := &WSConnection{
		conn:      c,
		GMChan:    gm,
		writeChan: make(chan *MsgObj, 200),

		connMsg: &ConnMessage{},
		Stats:   NewGameStats(),

		Cache:           map[int]interface{}{},
		Admin:           false,
		LastTopPosition: -1,
		valid:           false,
	}
	ws.connMsg.ws = ws

	logger.Debug("New WS Connection")
	go ws.init()
	return ws
}

func (ws *WSConnection) SetStatus(status ConnStatus) {
	ws.status = status
}

func (ws *WSConnection) Close() {
	ws.conn.Close()
}

func (ws *WSConnection) init() {
	ws.status = CONN_STATUS_AUTH

	go ws.readEvents()
	ws.writeEvents()
}

func (ws *WSConnection) sendGameMessage(id byte, msg []byte) {
	ws.Lock()
	ws.connMsg.id = id
	ws.connMsg.msg = msg
	ws.GMChan <- *ws.connMsg
	ws.Unlock()
}

func (ws *WSConnection) readEvents() {
	defer ws.kill()
	logger.Debug("WS Enabled read events")

	//ws.conn.SetReadDeadline(time.Now().Add(connReadWait))
	for {
		msgType, buff, err := ws.conn.ReadMessage()
		if err != nil {
			if ws.Admin {
				logger.Error("Core disconnected...")
				CoreConnection.SetConnection(nil)
			} else {
				ws.DisconnectedBeforeGameOver()
			}

			break
		}

		if ws.Admin {
			ws.adminHandler(buff)
			continue
		}

		if msgType != websocket.BinaryMessage {
			if !ws.adminAuth(buff) {
				logger.Warn("Refused an invalid connection attempt from a unknow core.")
				break
			}

			CoreConnection.SetConnection(ws)

			logger.Infof("Assigned ID by core: %s", SERVER_ID)
			time.Sleep(1 * time.Second)
			err := ws.writeMessage(websocket.TextMessage, []byte("Success"))
			if err != nil {
				logger.Errorf("Core Error: %s", err)
				break
			}

			CoreConnection.SendCoreUpdate()
			continue
		}

		ws.quota++
		if !ws.valid {
			ws.authMessage(buff)
		} else if len(buff) != 0 {
			ws.Stats.IncrementBytesIn(len(buff))
			go ws.sendGameMessage(buff[0], buff[1:])
		}
	}

	logger.Debug("WS disabled read events")
}

func (ws *WSConnection) debugID() string {
	if ws.Admin {
		return " - ADMIN"
	}
	if ws.ClientData == nil {
		return ""
	}
	return fmt.Sprintf("name:%s id:%s", ws.ClientData.Name, ws.ClientData.Id)
}

func (ws *WSConnection) writeEvents() {
	logger.Debug("WS Enabled writing events")

	/*defer func(){ //open channels but not used are garbage collected by go
		time.Sleep(10*time.Second)
		logger.Debug("Closing write channel")
		close(ws.writeChan)
	}()*/

	defer logger.Debug("WS disabled write events")

	for msg := range ws.writeChan {
		switch msg.Id {
		case WS_MSG_TYPE_AUTH:
			//ws.Lock()
			if ws.status == CONN_STATUS_AUTH {
				go ws.sendAndFreeBuff(msg)
				ws.status = CONN_STATUS_OPEN
			}
			//ws.Unlock()

		case WS_MSG_TYPE_UPDATE:
			//ws.Lock()
			if ws.status == CONN_STATUS_OPEN {
				go ws.sendAndFreeBuff(msg)
			}
			//ws.Unlock()

		case WS_MSG_TYPE_GAME_OVER:
			//ws.Lock()
			if ws.status != CONN_STATUS_CLOSED {
				go ws.sendAndFreeBuff(msg)
				go ws.CloseAfterGameOver()
				go ws.SaveGame()
			}
			//ws.Unlock()

		case WS_MSG_TYPE_KILL:
			//ws.Lock()
			if ws.status == CONN_STATUS_OPEN {
				go ws.sendGameMessage(MSG_ID_CLOSE, dummyBuff)
			}
			//ws.Unlock()

		case WS_MSG_TYPE_CLOSE:
			//ws.Lock()
			if ws.status != CONN_STATUS_CLOSED {
				ws.status = CONN_STATUS_CLOSED
				go ws.conn.Close()
				//close(ws.writeChan)
				return
			}
			//ws.Unlock()

		case WS_MSG_TYPE_SAVE_GAME:
			//ws.Lock()
			if ws.status != CONN_STATUS_AUTH {
				go ws.SaveGame()
			}
			//ws.Unlock()
		}
	}
}

func (ws *WSConnection) sendBuff(buff []byte) {
	if err := ws.writeMessage(websocket.BinaryMessage, buff); err != nil {
		if websocket.IsCloseError(err) || websocket.IsUnexpectedCloseError(err) {
			logger.Error(err)
			ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
		} else {
			logger.Warn(err)
		}
	}
}

func (ws *WSConnection) sendAndFreeBuff(msg *MsgObj) {
	ws.Stats.IncrementBytesOut(len(msg.Buff))
	ws.sendBuff(msg.Buff)
	msgPool.Free(msg)
}

func (ws *WSConnection) adminHandler(m []byte) {
	//todo, ws admin handler?
}

func (ws *WSConnection) adminAuth(m []byte) bool {
	logger.Debug("Validating core auth")
	s := string(m)
	if len(s) == 0 {
		return false
	}

	msg, err := utils.DecryptMessage(s)
	if err != nil {
		logger.Error(err)
		return false
	}

	if msg = strings.TrimSpace(msg); msg == "" {
		return false
	}

	mm := strings.Split(msg, ".")
	if len(mm) != 2 {
		return false
	}

	SERVER_ID = mm[1]

	return mm[0] == utils.CORE_AUTH_PASSWORD
}

func (ws *WSConnection) kill() {
	ws.msgQueue(WS_MSG_TYPE_KILL, dummyBuff)
}

func (ws *WSConnection) DisconnectedBeforeGameOver() {
	if ws.ClientData != nil && ws.Stats != nil && ws.Actor != nil && ws.Actor.State == STATE_DEAD {
		return
	}

	ws.Stats.SetEndDate(time.Now().Unix())
	ws.Stats.SetGameTime(ws.Stats.EndDate() - ws.Stats.StartDate())
	ws.Stats.SetPoints(0)
	ws.Stats.SetDeathBy(DeathByNothing)
	ws.Stats.SetKillerName("")

	ws.msgQueue(WS_MSG_TYPE_SAVE_GAME, dummyBuff)
}

func (ws *WSConnection) GameOver(actors int) {
	if ws.Stats.MaxTop() <= 0 {
		ws.Stats.SetMaxTop(actors)
	}

	ws.Stats.SetEndDate(time.Now().Unix())
	ws.Stats.SetGameTime(ws.Stats.EndDate() - ws.Stats.StartDate())
	ws.Stats.CalculatePoints()

	t := int(ws.Stats.GameTime())
	m := int(ws.Stats.MaxMass())
	tt := int(ws.Stats.TopTime())

	var d int
	var killer []byte
	deathBy := ws.Stats.DeathBy()
	if deathBy == DeathByBot || deathBy == DeathByPlayer {
		d = DeathByPlayer
		killer = utils.BufferFromString(ws.Stats.KillerName())
	} else {
		d = deathBy
	}

	buff := []byte{
		MSG_STATUS_INFO,
		MSG_ID_CLOSE,
		TIME_TO_KILL_PLAYER >> 8 & 0xff,
		TIME_TO_KILL_PLAYER >> 0 & 0xff,

		byte(d),

		byte(ws.Stats.Points()),

		byte(t >> 24 & 0xff),
		byte(t >> 16 & 0xff),
		byte(t >> 8 & 0xff),
		byte(t >> 0 & 0xff),

		byte(m >> 24 & 0xff),
		byte(m >> 16 & 0xff),
		byte(m >> 8 & 0xff),
		byte(m >> 0 & 0xff),

		byte(ws.Stats.MaxTop()),

		byte(tt >> 8 & 0xff),
		byte(tt >> 0 & 0xff),
	}

	if len(killer) != 0 {
		buff = append(buff, killer...)
	}

	ws.msgQueue(WS_MSG_TYPE_GAME_OVER, buff)
}

func (ws *WSConnection) CloseAfterGameOver() {
	time.Sleep(TIME_TO_KILL_PLAYER * time.Millisecond)
	ws.kill()
}

func (ws *WSConnection) SaveGame() {
	//logger.Debug("Trying to save database stats", ws.debugID())
	ws.Lock()
	if !ws.savedToDB {
		logger.Debug("Saving game stats to the database")

		ws.savedToDB = true

		if err := ws.Stats.SaveToDB(); err != nil {
			logger.Error(err)
		}

	} else {
		logger.Debug("Already saved the game stat on the database")
	}
	ws.Unlock()
}

func (ws *WSConnection) SavedToDB() bool {
	ws.Lock()
	defer ws.Unlock()
	return ws.savedToDB
}

func (ws *WSConnection) SetSavedToDB(v bool) {
	ws.Lock()
	ws.savedToDB = v
	ws.Unlock()
}

func (ws *WSConnection) SendUpdate(msg []byte, t float64) {
	if len(msg) == 0 {
		return
	}

	buff := []byte{
		MSG_STATUS_INFO,
		MSG_ID_WORLD,
	}

	buff = append(buff, utils.Float32bytes(t)...)
	buff = append(buff, msg...)

	//ws.msgQueue(WS_MSG_TYPE_UPDATE, buff)
	go ws.sendBuff(buff)
}

func (ws *WSConnection) SendInitialData(size int, d *ActorData) {
	buff := []byte{}
	buff = append(buff, MSG_STATUS_INFO, MSG_ID_INIT, byte(size))
	buff = append(buff, d.GetCreateBuffer()...)

	//ws.msgQueue(WS_MSG_TYPE_UPDATE, buff)
	go ws.sendBuff(buff)
}

func (ws *WSConnection) authMessage(p []byte) {
	logger.Debug("Checking auth message")

	if len(p) < 2 {
		logger.Warn("Client with invalid auth message length")

		if err := ws.writeMessage(websocket.BinaryMessage, []byte{MSG_ID_AUTH, MSG_ERROR_INVALID_AUTH}); err != nil {
			logger.Error(err)
		}
		ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
		return
	}

	id := p[0]
	if id != MSG_ID_AUTH {
		if err := ws.writeMessage(websocket.BinaryMessage, []byte{MSG_ID_AUTH, MSG_ERROR_INVALID_AUTH}); err != nil {
			logger.Error(err)
		}
		ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
		return
	}

	token, err := utils.StringFromBuffer(p[1:])
	if err != nil {
		logger.Warn(err)
		ws.writeMessage(websocket.BinaryMessage, []byte{MSG_ID_AUTH, MSG_ERROR_INVALID_AUTH})
		ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
		return
	}

	if IsValidAuthToken(token) {
		ws.successAuth(token)
	} else {
		ws.writeMessage(websocket.BinaryMessage, []byte{MSG_ID_AUTH, MSG_ERROR_INVALID_AUTH})
		ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
	}
}

func (ws *WSConnection) SendRadar(msg []byte) {
	b := []byte{
		MSG_STATUS_INFO,
		MSG_ID_RADAR,
	}

	b = append(b, msg...)
	ws.msgQueue(WS_MSG_TYPE_UPDATE, b)
}

func (ws *WSConnection) SendLeaderboard(msg []byte, position int) {
	buff := []byte{
		MSG_STATUS_INFO,
		MSG_ID_RANK,

		byte(position >> 8 & 0xff),
		byte(position >> 0 & 0xff),
	}

	buff = append(buff, msg...)

	ws.msgQueue(WS_MSG_TYPE_UPDATE, buff)

	if position != ws.LastTopPosition {

		if ws.LastTopPosition == -1 || position <= ws.Stats.MaxTop() {
			ws.Stats.SetMaxTop(position)
		}

		ws.LastTopPosition = position
	}

}

func (ws *WSConnection) writeMessage(messageType int, data []byte) error {
	ws.Lock()
	if err := ws.conn.SetWriteDeadline(time.Now().Add(connWriteWait)); err != nil {
		logger.Error(err)
	}

	err := ws.conn.WriteMessage(messageType, data)
	ws.Unlock()
	return err
}

func (ws *WSConnection) msgQueue(id MsgType, buff []byte) {
	//ws.Lock()
	//if ws.status != CONN_STATUS_CLOSED {
	msg := msgPool.Alloc()
	msg.Id = id
	msg.Buff = buff
	ws.writeChan <- msg
	//}
	//ws.Unlock()
}

func (ws *WSConnection) successAuth(token string) {
	p, err := GetPayloadFromToken(token)
	if err != nil {
		logger.Error(err)
		ws.msgQueue(WS_MSG_TYPE_CLOSE, dummyBuff)
		return
	}

	ws.valid = true

	logger.Debugf("Success auth. User:%s, Name:%s", p.User, p.Name)

	ws.ClientData = p
	ws.startDate = time.Now()

	ws.Stats.SetUser(ws.ClientData.User)
	ws.Stats.SetName(ws.ClientData.Name)
	ws.Stats.SetSkin(ws.ClientData.Skin.Skin.ID)
	ws.Stats.SetCostume(ws.ClientData.Skin.Costume.ID)
	ws.Stats.SetStartDate(ws.startDate.Unix())

	ws.sendAuthSuccess()
}

func (ws *WSConnection) sendAuthSuccess() {
	buff := []byte{
		MSG_STATUS_SUCCESS,
		MSG_ID_AUTH,
		0,
	}

	ws.msgQueue(WS_MSG_TYPE_AUTH, buff)
}
