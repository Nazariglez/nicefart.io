/**
 * Created by nazarigonzalez on 4/12/16.
 */

package core

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"

	"../game"
	"../utils"
)

type AuthRequest struct {
	Guest     bool         `json:"guest"`
	Name      string       `json:"name"`
	Skin      SkinConfigID `json:"skin"`
	User      string       `json:"user"`
	Server    string       `json:"server"`
	ServerNum int          `json:"serverNum"`
	Version   string       `json:"version"`
}

type SkinConfigID struct {
	Skin    string `json:"skin"`
	Costume string `json:"costume"`
}

func GetAuthRequest() AuthRequest {
	return AuthRequest{
		Guest:     true,
		Name:      "Guest",
		Skin:      SkinConfigID{utils.SkinDemos.Skins[0].ID, utils.SkinDemos.Costumes[0].ID},
		User:      "",
		Server:    "",
		ServerNum: 0,
		Version:   "",
	}
}

func checkAuth(data *AuthRequest) error {
	if data.Version != VERSION {
		return fmt.Errorf("Client trying to connect with an invalid client version (%s).", data.Version)
	}

	//todo default values
	if data.Name == "" {
		data.Name = "Guest"
	}

	if !isValidUserName(data.Name) {
		return fmt.Errorf("%s", "Invalid player name.")
	}

	if !isValidSkin(data.Skin) || !isValidUser(data.User) {
		return fmt.Errorf("%s", "Invalid request.")
	}

	secretSkin := utils.GetSecretSkinID(strings.ToLower(data.Name))
	if secretSkin != "" {
		data.Skin.Skin = secretSkin
	}

	secretCostume := utils.GetSecretCostumeID(strings.ToLower(data.Name))
	if secretCostume != "" {
		data.Skin.Costume = secretCostume
	}

	fmt.Println(data.Name, secretSkin, secretCostume)

	return nil
}

var invalidNameWords = []string{
	"https:",
	"http:",
	".com",
	".io",
	".net",
	"www.",
}

func isValidUserName(name string) bool {
	if utils.UnicodeLen(name) > 12 {
		return false
	}

	v := true
	for _, s := range invalidNameWords {
		if strings.Contains(name, s) {
			v = false
			break
		}
	}

	return v
}

func isValidSkin(skin SkinConfigID) bool {
	return utils.IsValidSkinId(skin.Skin) && utils.IsValidCostumeId(skin.Costume)
}

func isValidUser(u string) bool {
	//todo user system
	return true
}

func GetAuthCredentials(a *AuthRequest) (string, error) {
	skin, err := utils.ParseSkinById(a.Skin.Skin)
	if err != nil {
		return "", err
	}

	costume, err := utils.ParseCostumeById(a.Skin.Costume)
	if err != nil {
		return "", err
	}

	t := game.Payload{
		Id:      rand.Intn(999),
		Name:    a.Name,
		Skin:    utils.CustomSkinConfig{*skin, *costume},
		User:    a.User,
		Mission: -1, //todo set an id from core to the mission to complete in this game
	}

	payloadToCypher, err := json.Marshal(&t)
	if err != nil {
		return "", fmt.Errorf("%s", "Invalid token auth.")
	}

	p := base64.StdEncoding.EncodeToString(payloadToCypher)
	signature := game.GetSignature(t.Id, []byte(p))
	token := base64.StdEncoding.EncodeToString([]byte(p + "." + signature))

	h, err := GetAvailableHost(a.Server, a.ServerNum)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("{\"token\":\"%s\",\"host\":\"%s\", \"skin\":[\"%s\",\"%s\"]}", token, h, t.Skin.Skin.ID, t.Skin.Costume.ID), nil
}
