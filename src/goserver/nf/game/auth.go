/**
 * Created by nazarigonzalez on 11/10/16.
 */

package game

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"

	"strconv"
	"strings"

	"../logger"
	"../utils"
)

type Payload struct {
	Name    string                 `json:"name"`
	Skin    utils.CustomSkinConfig `json:"skin"`
	User    string                 `json:"user"`
	Id      int                    `json:"id"`
	Mission int                    `json:"mission"`
}

func IsValidAuthToken(token string) bool {
	logger.Debugf("Validating token %s", token)
	decodedToken, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		logger.Error(err)
		return false
	}

	data := strings.Split(string(decodedToken), ".")
	if len(data) != 2 || len(data[0]) == 0 || len(data[1]) == 0 {
		logger.Error("Invalid token length.")
		return false
	}

	payload, err := base64.StdEncoding.DecodeString(data[0])
	if err != nil {
		logger.Error(err)
		return false
	}

	var p Payload
	err = json.Unmarshal(payload, &p)
	if err != nil {
		logger.Error(err)
		return false
	}

	//todo check skin values to not send "bad" info to others client who can crash
	nameLen := utils.UnicodeLen(p.Name)
	if !utils.IsValidSkinId(p.Skin.Skin.ID) || !utils.IsValidCostumeId(p.Skin.Costume.ID) || nameLen == 0 || nameLen > 12 || p.Id == 0 {
		logger.Error("Invalid token skin or name length.")
		return false
	}

	logger.Debugf("Token Payload: %+v", p)
	return GetSignature(p.Id, []byte(data[0])) == data[1]
}

func GetSignature(id int, p []byte) string {
	mac := hmac.New(sha256.New, []byte(utils.JWT_SECRET+strconv.Itoa(id)))
	mac.Write(p)
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func GetPayloadFromToken(token string) (*Payload, error) {
	decodedToken, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		return nil, err
	}

	data := strings.Split(string(decodedToken), ".")
	payload, err := base64.StdEncoding.DecodeString(data[0])
	if err != nil {
		return nil, err
	}

	var p Payload
	err = json.Unmarshal(payload, &p)
	if err != nil {
		return nil, err
	}

	return &p, nil
}
