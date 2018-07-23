/**
 * Created by nazarigonzalez on 25/8/16.
 */
import {ENTITY_TYPE, POWER_UP_BINARY} from "../../common/interfaces";
import {LiteralObjectPool} from "../../common/LiteralObjectPool";
import {BufferView} from "../../common/Binary";

export interface PowerUpCreateConfig {
  id:number;
  type:ENTITY_TYPE;
  x:number;
  y:number;
  radius:number;
  powerType:number;
}

export interface PowerUpUpdateConfig {
  id:number;
  x:number;
  y:number;
}

export interface PowerUpStateConfig {
  time:number;
  totalTime:number;
  data:PowerUpUpdateConfig;
}

export interface PowerUpConfigHelper {
  createPool:LiteralObjectPool<PowerUpCreateConfig>;
  updatePool:LiteralObjectPool<PowerUpUpdateConfig>;
  statePool:LiteralObjectPool<PowerUpStateConfig>;
  getCreateConfigFromBuffer:(buffer:BufferView, offset:number)=>PowerUpCreateConfig;
  getUpdateConfigFromBuffer:(buffer:BufferView, offset:number)=>PowerUpUpdateConfig;
}

export const PowerUpCreateConfig:PowerUpCreateConfig = {
  id:null,
  type:null,
  x:null,
  y:null,
  radius:null,
  powerType:null
};

export const PowerUpUpdateConfig:PowerUpUpdateConfig = {
  id:null,
  x:null,
  y:null
};

export const PowerUpStateConfig:PowerUpStateConfig = {
  time:null,
  totalTime:null,
  data:null
};

let PowerUpCreateConfigPool:LiteralObjectPool<PowerUpCreateConfig> = new LiteralObjectPool(PowerUpCreateConfig, 10);
PowerUpCreateConfigPool.resetCallback = function(obj:PowerUpCreateConfig){
  obj.id = null;
  obj.type = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
  obj.powerType = null;
};

let PowerUpUpdateConfigPool:LiteralObjectPool<PowerUpUpdateConfig> = new LiteralObjectPool(PowerUpUpdateConfig, 10);
PowerUpUpdateConfigPool.resetCallback = function(obj:PowerUpUpdateConfig){
  obj.id = null;
  obj.x = null;
  obj.y = null;
};

let PowerUpStatePool:LiteralObjectPool<PowerUpStateConfig> = new LiteralObjectPool(PowerUpStateConfig, 10);
PowerUpStatePool.resetCallback = function(obj:PowerUpStateConfig){
  obj.time = null;
  obj.totalTime = null;
  PowerUpUpdateConfigPool.free(obj.data);
  obj.data = null;
};

export const PowerUpHelper:PowerUpConfigHelper = {
  createPool: PowerUpCreateConfigPool,
  updatePool: PowerUpUpdateConfigPool,
  statePool: PowerUpStatePool,

  getCreateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:PowerUpCreateConfig = this.createPool.alloc();
    view.index = offset;
    config.id = view.autoGet(POWER_UP_BINARY[0]);
    config.type = view.autoGet(POWER_UP_BINARY[1]);
    config.x = view.autoGet(POWER_UP_BINARY[2]);
    config.y = view.autoGet(POWER_UP_BINARY[3]);
    config.radius = view.autoGet(POWER_UP_BINARY[4]);
    config.powerType = view.autoGet(POWER_UP_BINARY[5]);
    return config;
  },

  getUpdateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:PowerUpUpdateConfig = this.updatePool.alloc();
    view.index = offset;
    config.id = view.autoGet(POWER_UP_BINARY[0]);
    config.x = view.autoGet(POWER_UP_BINARY[2]);
    config.y = view.autoGet(POWER_UP_BINARY[3]);
    return config;
  }
};