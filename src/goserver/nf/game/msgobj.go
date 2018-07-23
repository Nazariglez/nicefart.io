// Created by nazarigonzalez on 19/3/17.

package game

import (
	"sync"
)

type MsgType int

const (
	WS_MSG_TYPE_AUTH      = iota //0
	WS_MSG_TYPE_UPDATE           //1
	WS_MSG_TYPE_KILL             //2
	WS_MSG_TYPE_GAME_OVER        //3
	WS_MSG_TYPE_CLOSE            //4
	WS_MSG_TYPE_SAVE_GAME        //5
)

type MsgObj struct {
	Id   MsgType
	Buff []byte
}

type MsgObjPool struct {
	sync.Mutex

	objs []*MsgObj
}

func NewMsgObjPool() *MsgObjPool {
	p := &MsgObjPool{}

	for i := 0; i < 2000; i++ {
		p.objs = append(p.objs, &MsgObj{})
	}

	return p
}

func (p *MsgObjPool) Alloc() *MsgObj {
	p.Lock()
	defer p.Unlock()

	if len(p.objs) == 0 {
		return &MsgObj{}
	}

	o := p.objs[0]
	p.objs[0] = nil
	p.objs = p.objs[1:]

	return o
}

func (p *MsgObjPool) Free(o *MsgObj) {
	p.Lock()
	defer p.Unlock()

	p.objs = append(p.objs, o)
}
