// Created by nazarigonzalez on 19/2/17.

package core

import (
	"strconv"
	"time"

	"../db"
)

type LeaderBoardType int
type LeaderBoardTime int

const (
	LEADERBOARD_POINTS LeaderBoardType = iota
	LEADERBOARD_TOP_TIME
	LEADERBOARD_MAX_MASS
	LEADERBOARD_GAME_TIME
	LEADERBOARD_KILLER
	LEADERBOARD_BIG_VICTIM
)

const (
	LEADERBOARD_TIME_TODAY LeaderBoardTime = iota
	LEADERBOARD_TIME_WEEK
	LEADERBOARD_TIME_MONTH
	LEADERBOARD_TIME_TOTAL
)

func GetLeaderBoard(ord LeaderBoardType, t LeaderBoardTime, n int) ([]db.Game, error) {
	if n == 0 {
		n = 10
	}

	createdAt := getLeaderBoardDate(t)
	orderBy := getLeaderBoardOrder(ord)

	var games []db.Game

	if ord == LEADERBOARD_KILLER {
		if err := db.DB().Select("*, (players_killed + bots_killed) as SUM_VICTIMS").Where("created_at >= ? AND death_by != ?", createdAt, 0).Order(orderBy).Limit(n).Find(&games).Error; err != nil {
			return games, err
		}
	} else {
		if err := db.DB().Where("created_at >= ? AND death_by != ?", createdAt, 0).Order(orderBy).Limit(n).Find(&games).Error; err != nil {
			return games, err
		}
	}

	return games, nil
}

func getLeaderBoardDate(t LeaderBoardTime) time.Time {
	switch t {
	case LEADERBOARD_TIME_TODAY:
		return time.Now().AddDate(0, 0, -1)
	case LEADERBOARD_TIME_WEEK:
		return time.Now().AddDate(0, 0, -7)
	case LEADERBOARD_TIME_MONTH:
		return time.Now().AddDate(0, -1, 0)
	case LEADERBOARD_TIME_TOTAL:
		return time.Now().AddDate(-20, 0, 0)
	}

	return time.Now()
}

func getLeaderBoardOrder(typ LeaderBoardType) string {
	switch typ {
	case LEADERBOARD_POINTS:
		return "points desc"
	case LEADERBOARD_GAME_TIME:
		return "game_time desc"
	case LEADERBOARD_BIG_VICTIM:
		return "max_mass_killed desc"
	case LEADERBOARD_KILLER:
		return "SUM_VICTIMS desc, points desc"
	case LEADERBOARD_MAX_MASS:
		return "max_mass desc"
	case LEADERBOARD_TOP_TIME:
		return "top_time desc"
	}

	return ""
}

type LeaderBoardData struct {
	Date  string
	Type  string
	Data  string
	Name  string
	Games []*LeaderBoardDataGames
}

type LeaderBoardDataGames struct {
	N    int
	Name string
	Data interface{}
}

func GetLeaderBoardData(date, typ string, games []db.Game) *LeaderBoardData {
	d := &LeaderBoardData{
		Type:  typ,
		Date:  date,
		Games: []*LeaderBoardDataGames{},
	}

	data := ""
	name := ""

	switch typ {
	case "points":
		data = "Points"
		name = "Points"
	case "max-size":
		data = "Max Size"
		name = "Max Size"
	case "killer":
		data = "Kills"
		name = "Killer"
	case "big-kill":
		data = "Victim Size"
		name = "Best Kill"
	case "time":
		data = "Time"
		name = "Game Time"
	case "top-time":
		data = "Time"
		name = "Time at #1"
	}

	switch date {
	case "today":
		name = name + " - Today"
	case "week":
		name = name + " - Week"
	case "month":
		name = name + " - Month"
	}

	for n, v := range games {
		dg := &LeaderBoardDataGames{
			N:    n + 1,
			Name: v.Name,
		}

		switch typ {
		case "points":
			dg.Data = v.Points
		case "max-size":
			dg.Data = v.MaxMass
		case "killer":
			dg.Data = v.PlayersKilled + v.BotsKilled
		case "big-kill":
			dg.Data = v.MaxMassKilled
		case "time":
			dg.Data = getStringTime(int(v.GameTime))
		case "top-time":
			dg.Data = getStringTime(int(v.TopTime))
		}

		d.Games = append(d.Games, dg)
	}

	d.Name = name
	d.Data = data

	return d
}

func getStringTime(t int) string {
	var str string
	var m int
	var ss int
	m = t / 60
	ss = t % 60

	str = strconv.Itoa(m) + "m " + strconv.Itoa(ss) + "s"

	return str
}
