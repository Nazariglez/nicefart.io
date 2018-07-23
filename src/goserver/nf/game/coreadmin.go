// Created by nazarigonzalez on 18/3/17.

package game

import (
	"../logger"
	"fmt"
	"sync"
)

var CoreConnection = &CoreAdmin{}

type CoreAdmin struct {
	sync.Mutex
	ws        *WSConnection
	connected bool
}

func (c *CoreAdmin) SetConnection(ws *WSConnection) {
	c.Lock()
	if ws != nil {
		ws.SetStatus(CONN_STATUS_OPEN)
		ws.Admin = true
		c.ws = ws
		c.connected = true
	} else {
		c.connected = false
	}
	c.Unlock()
}

func (c *CoreAdmin) SendCoreUpdate() {
	c.Lock()
	if c.connected {
		status := c.getServerStatus()
		logger.Debugf("Sending core update: %s", status)
		c.send(status)
	}
	c.Unlock()
}

func (c *CoreAdmin) send(msg string) {
	if c.ws != nil {
		c.ws.msgQueue(WS_MSG_TYPE_UPDATE, []byte(msg))
	}
}

func (c *CoreAdmin) getServerStatus() string {
	gamesLength := len(games)
	pl := 0
	bots := 0
	for _, g := range games {
		p, b := g.PlayersAndBotsLength()
		pl += p
		bots += b
	}

	return fmt.Sprintf(
		"{\"rooms\":%d,\"players\":%d,\"bots\":%d}",
		gamesLength, pl, bots,
	)
}

func (c *CoreAdmin) SendCoreWarning(msg string) {
	c.Lock()
	if c.connected {
		logger.Warnf("Sended to core: %s", msg)
		c.send(msg)
	}
	c.Unlock()
}
