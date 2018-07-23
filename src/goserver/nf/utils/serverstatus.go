// Created by nazarigonzalez on 6/2/17.

package utils

//todo use https://github.com/shirou/gopsutil?

type GameServerStatus struct {
	ID          string `json:"id"` //string assigned by the core
	Rooms       []int  `json:"rooms"`
	Players     int    `json:"players"`
	Bots        int    `json:"bots"`
	TotalActors int    `json:"totalActod"`

	Date int64 `json:"date"` //time.Now().Unix() (timestamp in seconds)
	//todo memory? cpu?
}

type RoomStatus struct {
	ID              int     `json:"id"` //index
	Players         int     `json:"players"`
	Bots            int     `json:"bots"`
	Food            int     `json:"food"`
	TotalActors     int     `json:"totalActors"`
	MapSize         int     `json:"mapSize"`
	LoopTime        float64 `json:"loopTime"`
	WorldUpdateTime float64 `json:"worldUpdateTime"`
	GameTime        float64 `json:"gameTime"`
	BytesIn         int     `json:"bytesIn"`
	BytesOut        int     `json:"bytesOut"`
	TotalBytesIn    int     `json:"totalBytesIn"`
	TotalBytesOut   int     `json:"totalBytesOut"`
}

type GORMServerStatus struct {
	Zone    string //usa? europa?
	Rooms   int    //len(Rooms)
	Players int
	Bots    int
	Date    int64
	//etc... cpu, memory, totalactos
}
