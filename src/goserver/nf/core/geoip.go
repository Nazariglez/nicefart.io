/**
 * Created by nazarigonzalez on 26/12/16.
 */

package core

import (
	"bytes"
	"fmt"
	"github.com/oschwald/geoip2-golang"
	"net"
	"net/http"
	"strings"
)

var geodb *geoip2.Reader

func OpenGeoDB(geoFile string) error {
	if geodb == nil {
		db, err := geoip2.Open(geoFile)
		if err != nil {
			return err
		}

		geodb = db
	}

	return nil
}

func CheckIPCountry(ipAddr string) (continent, country string, err error) {
	if geodb == nil {
		return "", "", fmt.Errorf("%s", "Invalid database")
	}

	ip := net.ParseIP(ipAddr)
	if ip == nil {
		return "", "", fmt.Errorf("%s", "Invalid IP Address")
	}

	c, err := geodb.Country(ip)
	if err != nil {
		return "", "", err
	}

	continent, country = c.Continent.Code, c.Country.IsoCode
	if continent == "" {
		err = fmt.Errorf("%s", "Invalid continent or country")
	}
	return
}

func GetClientIP(r *http.Request) (string, error) {
	/*h, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return "", err
	}

	return h, nil*/

	ip := getIPAdress(r)
	if ip == "" {
		return "", fmt.Errorf("%s", "Unable to get the ip address")
	}

	return ip, nil
}

//ipRange - a structure that holds the start and end of a range of ip addresses
type ipRange struct {
	start net.IP
	end   net.IP
}

// inRange - check to see if a given ip address is within a range given
func inRange(r ipRange, ipAddress net.IP) bool {
	// strcmp type byte comparison
	if bytes.Compare(ipAddress, r.start) >= 0 && bytes.Compare(ipAddress, r.end) < 0 {
		return true
	}
	return false
}

var privateRanges = []ipRange{
	ipRange{
		start: net.ParseIP("10.0.0.0"),
		end:   net.ParseIP("10.255.255.255"),
	},
	ipRange{
		start: net.ParseIP("100.64.0.0"),
		end:   net.ParseIP("100.127.255.255"),
	},
	ipRange{
		start: net.ParseIP("172.16.0.0"),
		end:   net.ParseIP("172.31.255.255"),
	},
	ipRange{
		start: net.ParseIP("192.0.0.0"),
		end:   net.ParseIP("192.0.0.255"),
	},
	ipRange{
		start: net.ParseIP("192.168.0.0"),
		end:   net.ParseIP("192.168.255.255"),
	},
	ipRange{
		start: net.ParseIP("198.18.0.0"),
		end:   net.ParseIP("198.19.255.255"),
	},
}

// isPrivateSubnet - check to see if this ip is in a private subnet
func isPrivateSubnet(ipAddress net.IP) bool {
	// my use case is only concerned with ipv4 atm
	if ipCheck := ipAddress.To4(); ipCheck != nil {
		// iterate over all our ranges
		for _, r := range privateRanges {
			// check if this ip is in a private range
			if inRange(r, ipAddress) {
				return true
			}
		}
	}
	return false
}

func getIPAdress(r *http.Request) string {
	for _, h := range []string{"X-Forwarded-For", "X-Real-Ip"} {
		addresses := strings.Split(r.Header.Get(h), ",")
		// march from right to left until we get a public address
		// that will be the address right before our proxy.
		for i := len(addresses) - 1; i >= 0; i-- {
			ip := strings.TrimSpace(addresses[i])
			// header can contain spaces too, strip those out.
			realIP := net.ParseIP(ip)
			if !realIP.IsGlobalUnicast() || isPrivateSubnet(realIP) {
				// bad address, go to next
				continue
			}
			return ip
		}
	}
	return ""
}
