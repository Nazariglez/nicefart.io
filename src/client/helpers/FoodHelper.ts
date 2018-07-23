/**
 * Created by nazarigonzalez on 25/8/16.
 */
import {ENTITY_TYPE, FOOD_BINARY} from "../../common/interfaces";
import {LiteralObjectPool} from "../../common/LiteralObjectPool";
import {BufferView} from "../../common/Binary";

export interface FoodCreateConfig {
  id:number;
  type:ENTITY_TYPE;
  mass:number;
  x:number;
  y:number;
  radius:number;
}

export interface FoodUpdateConfig {
  id:number;
  x:number;
  y:number;
}

export interface FoodStateConfig {
  time:number;
  totalTime:number;
  data:FoodUpdateConfig;
}

export interface FoodConfigHelper {
  createPool:LiteralObjectPool<FoodCreateConfig>;
  updatePool:LiteralObjectPool<FoodUpdateConfig>;
  statePool:LiteralObjectPool<FoodStateConfig>;
  getCreateConfigFromBuffer:(buffer:BufferView, offset:number)=>FoodCreateConfig;
  getUpdateConfigFromBuffer:(buffer:BufferView, offset:number)=>FoodUpdateConfig;
}

export const foodCreateConfig:FoodCreateConfig = {
  id:null,
  type:null,
  mass:null,
  x:null,
  y:null,
  radius:null
};

export const foodUpdateConfig:FoodUpdateConfig = {
  id:null,
  x:null,
  y:null
};

export const foodStateConfig:FoodStateConfig = {
  time:null,
  totalTime:null,
  data:null
};

let foodCreateConfigPool:LiteralObjectPool<FoodCreateConfig> = new LiteralObjectPool(foodCreateConfig, 10);
foodCreateConfigPool.resetCallback = function(obj:FoodCreateConfig){
  obj.id = null;
  obj.type = null;
  obj.mass = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
};

let foodUpdateConfigPool:LiteralObjectPool<FoodUpdateConfig> = new LiteralObjectPool(foodUpdateConfig, 10);
foodUpdateConfigPool.resetCallback = function(obj:FoodUpdateConfig){
  obj.id = null;
  obj.x = null;
  obj.y = null;
};

let foodStatePool:LiteralObjectPool<FoodStateConfig> = new LiteralObjectPool(foodStateConfig, 10);
foodStatePool.resetCallback = function(obj:FoodStateConfig){
  obj.time = null;
  obj.totalTime = null;
  foodUpdateConfigPool.free(obj.data);
  obj.data = null;
};

export const FoodHelper:FoodConfigHelper = {
  createPool: foodCreateConfigPool,
  updatePool: foodUpdateConfigPool,
  statePool: foodStatePool,

  getCreateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:FoodCreateConfig = this.createPool.alloc();
    view.index = offset;
    config.id = view.autoGet(FOOD_BINARY[0]);
    config.type = view.autoGet(FOOD_BINARY[1]);
    config.mass = view.autoGet(FOOD_BINARY[2]);
    config.x = view.autoGet(FOOD_BINARY[3]);
    config.y = view.autoGet(FOOD_BINARY[4]);
    config.radius = view.autoGet(FOOD_BINARY[5]);
    return config;
  },

  getUpdateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:FoodUpdateConfig = this.updatePool.alloc();
    view.index = offset;
    config.id = view.autoGet(FOOD_BINARY[0]);
    config.x = view.autoGet(FOOD_BINARY[3]);
    config.y = view.autoGet(FOOD_BINARY[4]);
    return config;
  }
};