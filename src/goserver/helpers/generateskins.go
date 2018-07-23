// Created by nazarigonzalez on 17/4/17.

package main

import (
  "../nf/utils"
  "io/ioutil"
  "encoding/json"
  "../nf/logger"
  "time"
)

type ServerEnviroments struct {
  Config map[string]interface{} `json:"config"`
  Skins  utils.SkinsInfo        `json:"skins"`
}

func main() {
  logger.SetLevel(logger.TraceLevel)
  logger.Init("./gen.txt")

  logger.Info("Reading config.json...")
  f, err := ioutil.ReadFile("./src/goserver/config.json")
  if err != nil {
    logger.Fatal(err)
  }

  var s ServerEnviroments
  json.Unmarshal(f, &s)

  if err := utils.InitializeSkins(s.Skins); err != nil {
    logger.Fatal(err)
  }

  data := "//Autogenerate by go for v" + s.Config["version"].(string) + "\n" +
    "const skinsConfig = " + string(utils.ConfigSkinsByte) + ";\n" +
    "export default skinsConfig;"

  if err := ioutil.WriteFile("./src/client/skins.ts", []byte(data), 0640); err != nil {
    logger.Fatal(err)
  }

  logger.Info("Generated client skinsConfig for v" + s.Config["version"].(string))
  time.Sleep(100*time.Microsecond)
}