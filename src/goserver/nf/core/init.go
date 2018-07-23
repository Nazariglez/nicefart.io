/**
 * Created by nazarigonzalez on 28/11/16.
 */

package core

import (
	"net/http"
	"net/url"
	"time"

	"encoding/json"
	"fmt"
	"io/ioutil"
	"sync"

	"../utils"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"html/template"
	"path"
	"strconv"
	"strings"

	"../db"
	"../logger"
)

const playersOffset = 100
const leaderboardResults = 200

var PRODUCTION bool

type ServerEnviroments struct {
	Config map[string]interface{} `json:"config"`
	Prod   []ServerList           `json:"prod"`
	Dev    []ServerList           `json:"dev"`
	Skins  utils.SkinsInfo        `json:"skins"`
}

type ServerList struct {
	Id      string        `json:"id"`
	Name    string        `json:"name"`
	Hosts   []RoomInfo    `json:"hosts"`
	Default bool          `json:"default"`
	Servers []*ServerInfo `json:"servers"`
}

type RoomInfo struct {
	Url   string `json:"url"`
	Max   int    `json:"max"`
	Split int    `json:"split"`
}

type ServerInfo struct {
	Id                   string
	URL                  string
	Players, Bots, Rooms int
	Max, Split           int
	Connected            bool
}

type PublicServerStatus struct {
	Id      string `json:"id"`
	Name    string `json:"name"`
	Servers int    `json:"servers"`
	Rooms   int    `json:"rooms"`
	Players int    `json:"players"`
}

//TODO more info, like ram, cpu, id, etc... to save in the DB
type PrivateServerStatus struct {
	Rooms   int `json:"rooms"`
	Players int `json:"players"`
	Bots    int `json:"bots"`
}

var tmplFunc = template.FuncMap{
	"sum": func(a, b int) int {
		return a + b
	},
	"eq": func(a, b interface{}) bool {
		return a == b
	},
}

var mu sync.Mutex

var ServersStatus []ServerList
var templates *template.Template

var VERSION string

func Init(prod bool, port, configPath string) {
	PRODUCTION = prod
	logger.Debug("Opening GeoDB...")
	if err := OpenGeoDB(path.Join(configPath, "GeoLite2-Country.mmdb")); err != nil {
		logger.Fatal(err)
	}

	logger.Debug("Opening server config...")
	f, err := ioutil.ReadFile(path.Join(configPath, "config.json"))
	if err != nil {
		logger.Fatal(err)
	}

	logger.Debug("Reading templates...")
	if err := readTemplates(configPath); err != nil {
		logger.Fatal(err)
	}

	var i ServerEnviroments
	json.Unmarshal(f, &i)

	VERSION = i.Config["version"].(string)
	if err := utils.InitializeSkins(i.Skins); err != nil {
		logger.Fatal(err)
	}

	logger.Infof("Version: %s", VERSION)

	if prod {
		ServersStatus = i.Prod
	} else {
		ServersStatus = i.Dev
	}

	if len(ServersStatus) == 0 {
		logger.Fatal("Error: Empty server list.")
		return
	}

	existsHosts := false
	for n, s := range ServersStatus {
		if len(s.Hosts) != 0 {
			logger.Debugf("Detected %d hosts for %s region", len(s.Hosts), s.Name)
			existsHosts = true

			for i, v := range s.Hosts {
				u := url.URL{Scheme: "ws", Host: v.Url}
				ss := &ServerInfo{
					Id:        s.Id + strconv.Itoa(i),
					URL:       u.String(),
					Connected: false,
					Players:   0,
					Bots:      0,
					Max:       v.Max,
					Split:     v.Split,
				}

				logger.Debugf("Added host: [%s] %s", ss.Id, ss.URL)

				//ServersStatus[n].Servers = append(s.Servers, ss)
				s.Servers = append(s.Servers, ss)
				go connectTo(&ServersStatus[n], ss)
			}

			ServersStatus[n].Servers = s.Servers
		}
	}

	if !existsHosts {
		logger.Fatal("Error: Empty host list.")
		return
	}

	router := mux.NewRouter()
	router.HandleFunc("/auth", authHandler).Methods("POST")
	router.HandleFunc("/info", infoHandler).Methods("GET")
	router.HandleFunc("/servers", serverHandler).Methods("GET")
	router.HandleFunc("/config", configDemoHandler).Methods("POST")
	router.HandleFunc("/leaderboard", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/leaderboard/", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/leaderboard/{date}", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/leaderboard/{date}/", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/leaderboard/{date}/{type}", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/leaderboard/{date}/{type}/", leaderBoardHandler).Methods("GET")
	router.HandleFunc("/api/leaderboard/{date}/{type}/", apiLeaderBoardHandler).Methods("POST")

	if !PRODUCTION {
		router.PathPrefix("/").Handler(
			http.StripPrefix("/", http.FileServer(http.Dir("build/client"))),
		)
	} else {
		router.PathPrefix("/").Handler(
			http.StripPrefix("/", http.FileServer(http.Dir("client"))),
		)
	}

	http.Handle("/", router)

	if err := http.ListenAndServe(port, nil); err != nil {
		logger.Fatal(err)
	}
}

func readTemplates(configPath string) error {
	var allTemplates []string

	files, err := ioutil.ReadDir(path.Join(configPath, "/views"))
	if err != nil {
		return err
	}

	for _, f := range files {
		name := f.Name()
		if strings.HasSuffix(name, ".tmpl") {
			allTemplates = append(allTemplates, path.Join(configPath, "/views", name))
		}
	}

	templates, err = template.New("").Funcs(tmplFunc).ParseFiles(allTemplates...)
	return err
}

func leaderBoardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")

	board, err := parseLeaderboardVars(mux.Vars(r))
	if err != nil {
		logger.Error(err)
		http.Error(w, err.Error(), 500)
		return
	}

	templates.Lookup("leaderboard.tmpl").Execute(w, board)
}

func parseLeaderboardVars(vars map[string]string) (*LeaderBoardData, error) {
	var games []db.Game
	var err error

	leaderboardTime := LEADERBOARD_TIME_TODAY
	lDate := "today"
	date, ok := vars["date"]
	if ok {
		switch date {
		case "today":
			leaderboardTime = LEADERBOARD_TIME_TODAY
		case "week":
			leaderboardTime = LEADERBOARD_TIME_WEEK
		case "month":
			leaderboardTime = LEADERBOARD_TIME_MONTH
		}

		lDate = date
	}

	leaderboardType := LEADERBOARD_POINTS
	lType := "points"
	typ, ok := vars["type"]
	if ok {

		switch typ {
		case "points":
			leaderboardType = LEADERBOARD_POINTS
		case "killer":
			leaderboardType = LEADERBOARD_KILLER
		case "max-size":
			leaderboardType = LEADERBOARD_MAX_MASS
		case "big-kill":
			leaderboardType = LEADERBOARD_BIG_VICTIM
		case "time":
			leaderboardType = LEADERBOARD_GAME_TIME
		case "top-time":
			leaderboardType = LEADERBOARD_TOP_TIME
		}

		lType = typ
	}

	games, err = GetLeaderBoard(leaderboardType, leaderboardTime, leaderboardResults)
	if err != nil {
		return &LeaderBoardData{}, err
	}

	return GetLeaderBoardData(lDate, lType, games), nil
}

func apiLeaderBoardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	board, err := parseLeaderboardVars(mux.Vars(r))
	if err != nil {
		logger.Error(err)
		http.Error(w, err.Error(), 500)
		return
	}

	d, err := json.Marshal(board)
	if err != nil {
		logger.Error(err)
		http.Error(w, err.Error(), 500)
		return
	}

	w.Write(d)
}

func infoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	mu.Lock()
	d, err := json.Marshal(ServersStatus)
	mu.Unlock()
	if err != nil {
		logger.Error(err)
		http.Error(w, "500 Server error", 500)
		return
	}

	w.Write(d)
}

func serverHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	d, err := json.Marshal(getPublicServerStatus())
	if err != nil {
		logger.Error(err)
		http.Error(w, "500 Server error", 500)
		return
	}

	w.Write(d)
}

func getPublicServerStatus() []*PublicServerStatus {
	d := []*PublicServerStatus{}
	for _, s := range ServersStatus {
		mu.Lock()
		ds := PublicServerStatus{
			Id:      s.Id,
			Name:    s.Name,
			Servers: 0,
			Rooms:   0,
			Players: 0,
		}

		for _, ss := range s.Servers {
			if ss.Connected {
				ds.Servers += 1
				ds.Rooms += ss.Rooms
				ds.Players += ss.Players + ss.Bots
			}
		}
		mu.Unlock()

		if ds.Servers > 0 {
			d = append(d, &ds)
		}
	}

	return d
}

func configDemoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
	w.Write(utils.ConfigSkinsByte)
}

func authHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logger.Error(err)
		http.Error(w, "Invalid auth", 400)
		return
	}

	d := GetAuthRequest()
	if err := json.Unmarshal(body, &d); err != nil {
		logger.Error(err)
		http.Error(w, "Invalid auth", 400)
		return
	}

	if d.Server != "" && len(d.Server) > 2 {
		zone := d.Server[:2]
		num, err := strconv.Atoi(d.Server[2:])
		if err != nil || num <= 0 {
			logger.Warnf("Invalid server id request from client: %s", d.Server)
			d.Server = ""
		} else {
			d.Server = zone
			d.ServerNum = num
		}
	}

	if d.Server == "" {
		ip, err := GetClientIP(r)
		if err != nil {
			logger.Error("Error: Getting IP from client.", err)
			d.Server = ""
		} else {
			logger.Debugf("Client ip: %s", ip)
			continent, _, err := CheckIPCountry(ip) //todo use country to save in db
			if err != nil {
				d.Server = ""
				logger.Warnf("Invalid ip country: %s", err)
			} else {
				d.Server = continent
				logger.Debug("Continent assigned: %s", continent)
			}
		}
	}

	logger.Debugf("Checking auth: %+v", d)
	if err := checkAuth(&d); err != nil {
		logger.Warn(err)
		http.Error(w, err.Error(), 400)
		return
	}

	rr, err := GetAuthCredentials(&d)
	if err != nil {
		logger.Warn(err)
		http.Error(w, err.Error(), 400)
		return
	}

	res := fmt.Sprintf("{\"status\":\"success\",\"data\":%s}", rr)
	logger.Debugf("Sending auth response: %+v", res)
	w.Write([]byte(res))
}

func connectTo(s *ServerList, server *ServerInfo) {
	logger.Infof("Connecting to %s %s\n", s.Name, server.URL)

	d := time.Duration(10)
	attempts := 0

	var conn *websocket.Conn
	for {
		c, _, err := websocket.DefaultDialer.Dial(server.URL, nil)
		if err != nil {
			if attempts == 5 || attempts == 10 || attempts == 23 { //send some emails to reminder
				//todo send email to the admin
				msg := fmt.Sprintf(`
					Region: %s
					Server: %s
					Addr: %s
					Attemps: %d
					Date: %s
				`,
					s.Name,
					server.Id,
					server.URL,
					attempts,
					time.Now(),
				)

				SendDisconnectedWarning("nazari.nz@gmail.com", msg)
				logger.Errorf("[%s - %s] Connection Attemps: %d. Sended warning email.", s.Name, server.Id, attempts)
			}

			mu.Lock()
			server.Connected = false
			mu.Unlock()
			logger.Errorf("[%s - %s] %s [Next try: %d seconds]", s.Name, server.Id, err.Error(), int(d))
			time.Sleep(d * time.Second)

			if d < 120 {
				d += 5
			}
			attempts++
			continue

		} else {
			attempts = 0
		}

		conn = c
		break
	}

	//defer conn.Close()

	go func(s *ServerList, server *ServerInfo) {
		defer conn.Close()

		logger.Infof("Try authentication to %s %s\n", s.Name, server.URL)
		msg, err := utils.EncryptMessage(utils.CORE_AUTH_PASSWORD + "." + server.Id)
		if err != nil {
			logger.Error(err)

			mu.Lock()
			server.Connected = false
			mu.Unlock()

			return
		}

		err = conn.WriteMessage(websocket.TextMessage, []byte(msg))
		if err != nil {
			logger.Error(err)

			mu.Lock()
			server.Connected = false
			mu.Unlock()

			return
		}

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				logger.Errorf("[%s] %s", s.Name, err.Error())

				mu.Lock()
				server.Connected = false
				mu.Unlock()

				time.Sleep(10 * time.Second)
				go connectTo(s, server)
				break
			}

			str := string(msg)
			if str == "Success" {
				logger.Infof("Succefully connection to [%s] %s - %s\n", s.Name, server.Id, server.URL)

				mu.Lock()
				server.Connected = true
				mu.Unlock()

				continue
			}

			if strings.Contains(str, "Warning") {
				logger.Warn(str)
			} else {

				logger.Infof("Server status [%s - %s]: %s", server.Id, server.URL, str)
				var d PrivateServerStatus
				err = json.Unmarshal(msg, &d)
				if err != nil {
					logger.Errorf("[%s] %s", s.Name, err.Error())
					continue
				}

				mu.Lock()
				server.Rooms = d.Rooms
				server.Players = d.Players
				server.Bots = d.Bots
				mu.Unlock()

			}

		}
	}(s, server)

}

func validateServerZone(zone string) string {
	if zone != "" {

		v := false
		for _, s := range ServersStatus {
			if s.Id == zone {
				v = true
				break
			}
		}

		if !v {
			zone = ""
		}

	}

	if zone == "" {
		for _, s := range ServersStatus {
			if s.Default {
				zone = s.Id
				break
			}
		}
	}

	return zone
}

func checkServerNum(zone string, num int) (string, error) {
	logger.Debugf("Checking requested server %s-%d", zone, num)

	addr := ""
	for _, s := range ServersStatus {
		if s.Id == zone && len(s.Servers) >= num {
			addr = s.Servers[num-1].URL
			break
		}
	}

	if addr == "" {
		logger.Warnf("Invalid server requested by client %s-%d", zone, num)
		return GetAvailableHost(zone, 0)
	}

	logger.Debugf("Server selected by client. [%s%d] - %s", zone, num, addr)
	return addr, nil
}

func GetAvailableHost(zone string, num int) (string, error) {
	//todo set max and split
	zone = validateServerZone(zone)
	logger.Debugf("Finding host in %s", zone)

	if num > 0 {
		return checkServerNum(zone, num)
	}

	v := false
	var servers []*ServerInfo
	for _, s := range ServersStatus {
		if s.Id == zone {
			v = true
			servers = s.Servers
			break
		}
	}

	if !v {
		return "", fmt.Errorf("%s", "Invalid server zone.")
	}

	addr := ""
	//under split servers
	for _, s := range servers {
		mu.Lock()
		if s.Connected && s.Rooms > 0 {
			if addr == "" && s.Players < s.Split {
				addr = s.URL
			}
		}
		mu.Unlock()
	}


	if addr == "" {
		offset := 15
		min := 99999999
		for _, s := range servers {
			mu.Lock()
			//if s.Players < s.Limit {
			avg := s.Players/offset
			logger.Trace("AVG", avg, s.Players)
			if avg < min {
				min = avg
				addr = s.URL
			}
			//}
			mu.Unlock()
		}
	}

	/*min := 99999999999
	addr := ""
	for _, s := range servers {

		mu.Lock()

		if s.Connected && s.Rooms > 0 {
			avg := (s.Players / s.Rooms) % playersOffset
			if avg < min {
				min = avg
				addr = s.URL
			}
		}
		mu.Unlock()

	}

	if addr == "" {

		//find an auxiliar server in other zone if no one is avalaibla
		for _, s := range ServersStatus {
			for _, ss := range s.Servers {

				mu.Lock()

				if ss.Connected && ss.Rooms > 0 {
					addr = ss.URL
					break
				}

				mu.Unlock()

			}

			if addr != "" {
				break
			}
		}

		if addr == "" {
			return "", fmt.Errorf("%s", "Client connection failed. No one server available.")
		}
	}*/

	if addr == "" {
		return "", fmt.Errorf("%s", "Client connection failed. No one server available.")
	}

	logger.Debugf("Host founded %s", addr)
	return addr, nil
}

//todo save ServerStatus each 10 seconds to a Database
