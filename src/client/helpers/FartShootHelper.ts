/**
 * Created by nazarigonzalez on 26/8/16.
 */
import {ENTITY_TYPE, FOOD_BINARY, FART_SHOOT_BINARY} from "../../common/interfaces";
import {LiteralObjectPool} from "../../common/LiteralObjectPool";
import {BufferView} from "../../common/Binary";

export interface FartShootCreateConfig {
  id:number;
  type:ENTITY_TYPE;
  mass:number;
  x:number;
  y:number;
  radius:number;
  owner:number;
  fartType:number;
}

export interface FartShootUpdateConfig {
  id:number;
  x:number;
  y:number;
}

export interface FartShootStateConfig {
  time:number;
  totalTime:number;
  data:FartShootUpdateConfig;
}

export interface FartShootConfigHelper {
  createPool:LiteralObjectPool<FartShootCreateConfig>;
  updatePool:LiteralObjectPool<FartShootUpdateConfig>;
  statePool:LiteralObjectPool<FartShootStateConfig>;
  getCreateConfigFromBuffer:(buffer:BufferView, offset:number)=>FartShootCreateConfig;
  getUpdateConfigFromBuffer:(buffer:BufferView, offset:number)=>FartShootUpdateConfig;
}

export const fartShootCreateConfig:FartShootCreateConfig = {
  id:null,
  type:null,
  mass:null,
  x:null,
  y:null,
  radius:null,
  owner:null,
  fartType: null
};

export const fartShootUpdateConfig:FartShootUpdateConfig = {
  id:null,
  x:null,
  y:null
};

export const fartShootStateConfig:FartShootStateConfig = {
  time:null,
  totalTime:null,
  data:null
};

let fartShootCreateConfigPool:LiteralObjectPool<FartShootCreateConfig> = new LiteralObjectPool(fartShootCreateConfig, 10);
fartShootCreateConfigPool.resetCallback = function(obj:FartShootCreateConfig){
  obj.id = null;
  obj.type = null;
  obj.mass = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
  obj.owner = null;
  obj.fartType = null;
};

let fartShootUpdateConfigPool:LiteralObjectPool<FartShootUpdateConfig> = new LiteralObjectPool(fartShootUpdateConfig, 10);
fartShootUpdateConfigPool.resetCallback = function(obj:FartShootUpdateConfig){
  obj.id = null;
  obj.x = null;
  obj.y = null;
};

let fartShootStatePool:LiteralObjectPool<FartShootStateConfig> = new LiteralObjectPool(fartShootStateConfig, 10);
fartShootStatePool.resetCallback = function(obj:FartShootStateConfig){
  obj.time = null;
  obj.totalTime = null;
  fartShootUpdateConfigPool.free(obj.data);
  obj.data = null;
};

export const FartShootHelper:FartShootConfigHelper = {
  createPool: fartShootCreateConfigPool,
  updatePool: fartShootUpdateConfigPool,
  statePool: fartShootStatePool,

  getCreateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:FartShootCreateConfig = this.createPool.alloc();
    view.index = offset;
    config.id = view.autoGet(FART_SHOOT_BINARY[0]);
    config.type = view.autoGet(FART_SHOOT_BINARY[1]);
    config.mass = view.autoGet(FART_SHOOT_BINARY[2]);
    config.x = view.autoGet(FART_SHOOT_BINARY[3]);
    config.y = view.autoGet(FART_SHOOT_BINARY[4]);
    config.radius = view.autoGet(FART_SHOOT_BINARY[5]);
    config.owner = view.autoGet(FART_SHOOT_BINARY[6]);
    config.fartType = view.autoGet(FART_SHOOT_BINARY[7]);
    return config;
  },

  getUpdateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:FartShootUpdateConfig = this.updatePool.alloc();
    view.index = offset;
    config.id = view.autoGet(FOOD_BINARY[0]);
    config.x = view.autoGet(FOOD_BINARY[3]);
    config.y = view.autoGet(FOOD_BINARY[4]);
    return config;
  }
};