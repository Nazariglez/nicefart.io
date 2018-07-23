// Created by nazarigonzalez on 1/2/17.

package utils

import (
	"../logger"
	"encoding/json"
	"errors"
	"math/rand"
	"strconv"
	"strings"
)

//todo IMPORTANTE las skins han de tener una ID asignada, para poder identificarlas en la DB sin depender del orden de guardado en el json

type SkinsInfo struct {
	Textures     map[string][]string `json:"textures"`
	TextureOrder []string            `json:"textureOrder"`
	Colors       ColorsInfo          `json:"colors"`
	Configs      SkinsConfigurations `json:"configs"`
}

type ColorsInfo struct {
	Skin        map[string]string `json:"skinColors"`
	Secondaries []string          `json:"secondaries"`
}

type SkinsConfigurations struct {
	Skins    []SkinInfo    `json:"skins"`
	Costumes []CostumeInfo `json:"costumes"`
}

type SkinInfo struct {
	ID      string `json:"id"`
	Value   int    `json:"value"`
	Color   string `json:"color"`
	Texture string `json:"texture"`
	Secret  string `json:"secret"`
}

type CostumeInfo struct {
	ID       string   `json:"id"`
	Value    int      `json:"value"`
	Textures []string `json:"textures"`
	Secret   string   `json:"secret"`
}

type DemoSkinsInfo struct {
	Skins    []*RealSkinInfo    `json:"skins"`
	Costumes []*RealCostumeInfo `json:"costumes"`
	Textures []string           `json:"textures"`
}

type RealSkinInfo struct {
	ID      string `json:"id"`
	Value   int    `json:"value"`
	Color   int    `json:"color"`
	Texture int    `json:"texture"`
	Secret  bool   `json:"secret"`
}

type RealCostumeInfo struct {
	ID       string  `json:"id"`
	Value    int     `json:"value"`
	Textures [][]int `json:"textures"`
	Secret   bool    `json:"secret"`
}

type CustomSkinConfig struct {
	Skin    RealSkinInfo    `json:"skin"`
	Costume RealCostumeInfo `json:"costume"`
}

var SkinDemos = DemoSkinsInfo{
	Skins:    []*RealSkinInfo{},
	Costumes: []*RealCostumeInfo{},
}

var ConfigSkins SkinsInfo
var ConfigSkinsByte []byte
var TextureList = []string{}
var TextureListFront = []string{}

func InitializeSkins(config SkinsInfo) error {
	ConfigSkins = config

	for _, v := range ConfigSkins.TextureOrder {
		TextureList = append(TextureList, v)
		TextureListFront = append(TextureListFront, ConfigSkins.Textures[v][0])
	}

	for i := 0; i < len(ConfigSkins.Configs.Skins); i++ {
		d, err := ParseSkin(i)
		if err != nil {
			return err
		}

		SkinDemos.Skins = append(SkinDemos.Skins, d)
	}

	for i := 0; i < len(ConfigSkins.Configs.Costumes); i++ {
		d, err := ParseCostume(i)
		if err != nil {
			return err
		}

		SkinDemos.Costumes = append(SkinDemos.Costumes, d)
	}

	//check repeated ids
	for i, v := range SkinDemos.Skins {
		for n, vv := range SkinDemos.Skins {
			if i != n && v.ID == vv.ID {
				return errors.New("Repeated skin id: " + v.ID)
			}
		}
	}

	for i, v := range SkinDemos.Costumes {
		for n, vv := range SkinDemos.Costumes {
			if i != n && v.ID == vv.ID {
				return errors.New("Repeated costume id: " + v.ID)
			}
		}
	}

	//todo sort by value before create the json-string
	SkinDemos.Textures = TextureListFront

	buff, err := json.Marshal(SkinDemos)
	if err != nil {
		return err
	}

	ConfigSkinsByte = buff
	logger.Debugf("Parsed: %d skins, %d costumes", len(SkinDemos.Skins), len(SkinDemos.Costumes))

	return nil
}

func GetTextureListID(id string) int {
	index := -1
	for i := 0; i < len(TextureList); i++ {
		if TextureList[i] == id {
			index = i
			break
		}
	}
	return index
}

func IsValidSkinId(id string) bool {
	return GetSkinIndex(id) != -1
}

func IsValidCostumeId(id string) bool {
	return GetCostumeIndex(id) != -1
}

func GetCostumeIndex(id string) int {
	index := -1
	for i := 0; i < len(ConfigSkins.Configs.Costumes); i++ {
		if id == ConfigSkins.Configs.Costumes[i].ID {
			index = i
			break
		}
	}

	return index
}

func GetSkinIndex(id string) int {
	index := -1
	for i := 0; i < len(ConfigSkins.Configs.Skins); i++ {
		if id == ConfigSkins.Configs.Skins[i].ID {
			index = i
			break
		}
	}

	return index
}

func ParseSkin(n int) (*RealSkinInfo, error) {
	if n > len(ConfigSkins.Configs.Skins)-1 || n < 0 {
		return nil, errors.New("Invalid skin index: " + strconv.Itoa(n))
	}

	if ConfigSkins.Configs.Skins[n].ID == "" {
		return nil, errors.New("Invalid skin config. Missed id.")
	}

	secret := false
	if ConfigSkins.Configs.Skins[n].Secret != "" {
		secret = true
	}

	return &RealSkinInfo{
		ID:      ConfigSkins.Configs.Skins[n].ID,
		Value:   ConfigSkins.Configs.Skins[n].Value,
		Color:   parseColorString(ConfigSkins.Colors.Skin[ConfigSkins.Configs.Skins[n].Color]),
		Texture: GetTextureListID(ConfigSkins.Configs.Skins[n].Texture),
		Secret:  secret,
	}, nil
}

func ParseSkinById(id string) (*RealSkinInfo, error) {
	if i := GetSkinIndex(id); i != -1 {
		return ParseSkin(i)
	}

	return nil, errors.New("Invalid skin id: " + id)
}

func ParseCostume(n int) (*RealCostumeInfo, error) {
	if n > len(ConfigSkins.Configs.Costumes)-1 || n < 0 {
		return nil, errors.New("Invalid costume index: " + strconv.Itoa(n))
	}

	if ConfigSkins.Configs.Costumes[n].ID == "" {
		return nil, errors.New("Invalid costume config. Missed id.")
	}

	textures := [][]int{}
	for _, vv := range ConfigSkins.Configs.Costumes[n].Textures {
		var color int
		if ConfigSkins.Textures[vv][1] == "color" {
			color = getSecondaryColor()
		} else {
			color = parseColorString(ConfigSkins.Colors.Secondaries[0])
		}

		textures = append(textures, []int{GetTextureListID(vv), color})
	}

	secret := false
	if ConfigSkins.Configs.Costumes[n].Secret != "" {
		secret = true
	}

	return &RealCostumeInfo{
		ID:       ConfigSkins.Configs.Costumes[n].ID,
		Value:    ConfigSkins.Configs.Costumes[n].Value,
		Textures: textures,
		Secret:   secret,
	}, nil
}

func GetSecretSkinID(name string) string {
	for i := 0; i < len(ConfigSkins.Configs.Skins); i++ {
		if ConfigSkins.Configs.Skins[i].Secret != "" && strings.Contains(name, ConfigSkins.Configs.Skins[i].Secret) {
			return ConfigSkins.Configs.Skins[i].ID
		}
	}

	return ""
}

func GetSecretCostumeID(name string) string {
	for i := 0; i < len(ConfigSkins.Configs.Costumes); i++ {
		if ConfigSkins.Configs.Costumes[i].Secret != "" && strings.Contains(name, ConfigSkins.Configs.Costumes[i].Secret) {
			return ConfigSkins.Configs.Costumes[i].ID
		}
	}

	return ""
}

func ParseCostumeById(id string) (*RealCostumeInfo, error) {
	if i := GetCostumeIndex(id); i != -1 {
		return ParseCostume(i)
	}

	return nil, errors.New("Invalid costume id:" + id)
}

func GetRandomCustomSkin() CustomSkinConfig {
	rndSkin := 0
	if rand.Float64() < 0.7 {
		if rand.Float64() < 0.5 {
			rndSkin = rand.Intn(10)
		} else {
			rndSkin = rand.Intn(42)

		}
	} else {
		rndSkin = rand.Intn(4)
	}

	skin, err := ParseSkin(rndSkin)
	if err != nil {
		logger.Fatal(err)
	}

	rndCostume := 0
	if rand.Float64() < 0.7 {
		if rand.Float64() < 0.3 {
			rndCostume = rand.Intn(3)
		} else {
			rndCostume = rand.Intn(10)
		}
	}
	costume, err := ParseCostume(rndCostume)
	if err != nil {
		logger.Fatal(err)
	}

	return CustomSkinConfig{*skin, *costume}
}

func getSecondaryColor() int {
	l := len(ConfigSkins.Colors.Secondaries)
	return parseColorString(ConfigSkins.Colors.Secondaries[1+rand.Intn(l-1)])
}

func parseColorString(c string) int {
	cc, err := strconv.ParseInt(c, 0, 64)
	if err != nil {
		logger.Fatal("Invalid color id: " + c)
	}
	return int(cc)
}

func (s *CustomSkinConfig) ToByte() []byte {
	b := []byte{}
	b = append(b, BufferFromString(s.Skin.ID)...) //skin id
	b = append(
		b,

		//skin value
		byte(s.Skin.Value>>8&0xff),
		byte(s.Skin.Value>>0&0xff),

		//skin color
		byte(s.Skin.Color>>24&0xff),
		byte(s.Skin.Color>>16&0xff),
		byte(s.Skin.Color>>8&0xff),
		byte(s.Skin.Color>>0&0xff),

		//skin texture index
		byte(s.Skin.Texture>>8&0xff),
		byte(s.Skin.Texture>>0&0xff),
	)

	tLen := len(s.Costume.Textures)

	b = append(b, BufferFromString(s.Costume.ID)...) //costume id
	b = append(
		b,

		//costume value
		byte(s.Skin.Value>>8&0xff),
		byte(s.Skin.Value>>0&0xff),

		//costume textures length
		byte(tLen),
	)

	for i := 0; i < tLen; i++ {
		b = append(
			b,

			byte(s.Costume.Textures[i][0]>>8&0xff),
			byte(s.Costume.Textures[i][0]>>0&0xff),

			byte(s.Costume.Textures[i][1]>>24&0xff),
			byte(s.Costume.Textures[i][1]>>16&0xff),
			byte(s.Costume.Textures[i][1]>>8&0xff),
			byte(s.Costume.Textures[i][1]>>0&0xff),
		)
	}

	return b
}
