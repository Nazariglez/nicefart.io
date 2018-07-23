/**
 * Created by nazarigonzalez on 24/8/16.
 */
import {ENTITY_TYPE, ACTOR_BINARY, customSkinConfig, skinConfig} from "../../common/interfaces";
import {LiteralObjectPool} from "../../common/LiteralObjectPool";
import {BufferView, BINARY} from "../../common/Binary";

export interface ActorCreateConfig {
  id:number;
  type:ENTITY_TYPE;
  name:string;
  x:number;
  y:number;
  radius:number;
  mass:number;
  flags:number;
  crazyTime:number;
  peppers:number;
  fastPercent:number;
  skin:customSkinConfig;
}

export interface ActorUpdateConfig {
  id:number;
  x:number;
  y:number;
  radius:number;
  mass:number;
  flags:number;
  crazyTime:number;
  peppers:number;
  fastPercent:number;
}

export interface ActorRemoveConfig {
  id:number;
  assasin:number;
}

export interface ActorStateConfig {
  time:number;
  totalTime:number;
  data:ActorUpdateConfig;
}

export interface ActorConfigHelper {
  createPool:LiteralObjectPool<ActorCreateConfig>;
  updatePool:LiteralObjectPool<ActorUpdateConfig>;
  removePool:LiteralObjectPool<ActorRemoveConfig>;
  statePool:LiteralObjectPool<ActorStateConfig>;
  getCreateConfigFromBuffer:(buffer:BufferView, offset:number)=>ActorCreateConfig;
  getUpdateConfigFromBuffer:(buffer:BufferView, offset:number)=>ActorUpdateConfig;
  getRemoveConfigFromBuffer:(buffer:BufferView, offser:number)=>ActorRemoveConfig;
}

export const actorCreateConfig:ActorCreateConfig = {
  id:null,
  type:null,
  name:null,
  x:null,
  y:null,
  radius:null,
  mass:null,
  flags:null,
  crazyTime:null,
  peppers:null,
  fastPercent:null,
  skin:null
};

export const actorUpdateConfig:ActorUpdateConfig = {
  id:null,
  x:null,
  y:null,
  radius:null,
  mass:null,
  flags:null,
  crazyTime:null,
  peppers:null,
  fastPercent:null
};

export const actorRemoveConfig:ActorRemoveConfig = {
  id:null,
  assasin:null
};

export const actorStateConfig:ActorStateConfig = {
  time: null,
  totalTime:null,
  data: null
};

let actorCreateConfigPool:LiteralObjectPool<ActorCreateConfig> = new LiteralObjectPool(actorCreateConfig, 10);
actorCreateConfigPool.resetCallback = function(obj:ActorCreateConfig){
  obj.id = null;
  obj.type = null;
  obj.name = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
  obj.mass = null;
  obj.flags = null;
  obj.crazyTime = null;
  obj.peppers = null;
  obj.fastPercent = null;
  obj.skin = null;
};

let actorUpdateConfigPool:LiteralObjectPool<ActorUpdateConfig> = new LiteralObjectPool(actorUpdateConfig, 10);
actorUpdateConfigPool.resetCallback = function(obj:ActorUpdateConfig){
  obj.id = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
  obj.mass = null;
  obj.flags = null;
  obj.crazyTime = null;
  obj.peppers = null;
  obj.fastPercent = null;
};

let actorRemoveConfigPool:LiteralObjectPool<ActorRemoveConfig> = new LiteralObjectPool(actorRemoveConfig, 10);
actorRemoveConfigPool.resetCallback = function(obj:ActorRemoveConfig){
  obj.id = null;
  obj.assasin = null;
};

let actorStatePool:LiteralObjectPool<ActorStateConfig> = new LiteralObjectPool(actorStateConfig, 10);
actorStatePool.resetCallback = function(obj:ActorStateConfig){
  obj.time = null;
  obj.totalTime = null;
  actorUpdateConfigPool.free(obj.data);
  obj.data = null;
};

export const ActorHelper:ActorConfigHelper = {
  createPool: actorCreateConfigPool,
  updatePool: actorUpdateConfigPool,
  removePool: actorRemoveConfigPool,
  statePool: actorStatePool,

  getCreateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:ActorCreateConfig = this.createPool.alloc();
    view.index = offset;
    config.id = view.autoGet(ACTOR_BINARY[0]);
    config.type = view.autoGet(ACTOR_BINARY[1]);
    config.name = (view.autoGet(ACTOR_BINARY[2]) as any);
    config.x = view.autoGet(ACTOR_BINARY[3]);
    config.y = view.autoGet(ACTOR_BINARY[4]);
    config.radius = view.autoGet(ACTOR_BINARY[5]);
    config.mass = view.autoGet(ACTOR_BINARY[6]);
    config.flags = view.autoGet(ACTOR_BINARY[7]);
    config.crazyTime = view.autoGet(ACTOR_BINARY[8]);
    config.peppers = view.autoGet(ACTOR_BINARY[9]);
    config.fastPercent = view.autoGet(ACTOR_BINARY[10]);
    /*config.skin.push(view.autoGet(BINARY.UInt8));
    config.skin.push(view.autoGet(BINARY.UInt8));
    config.skin.push(view.autoGet(BINARY.UInt8)); //length
    for(let i:number = 0; i < config.skin[2]; i++){
      config.skin.push(view.autoGet(BINARY.UInt8));
    */

    config.skin = {
      skin: {
        id: view.autoGet(BINARY.String) as any,
        value: view.autoGet(BINARY.UInt16),
        color: view.autoGet(BINARY.UInt32),
        texture: view.autoGet(BINARY.UInt16),
        secret: false,
      },
      costume: {
        id: view.autoGet(BINARY.String) as any,
        value: view.autoGet(BINARY.UInt16),
        textures: [],
        secret: false,
      }
    };

    let len:number = view.autoGet(BINARY.UInt8);

    for(let i = 0; i < len; i++){
      config.skin.costume.textures.push([view.autoGet(BINARY.UInt16), view.autoGet(BINARY.UInt32)]);
    }

    return config;
  },

  getUpdateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:ActorUpdateConfig = this.updatePool.alloc();
    view.index = offset;
    config.id = view.autoGet(ACTOR_BINARY[0]);
    config.x = view.autoGet(ACTOR_BINARY[3]);
    config.y = view.autoGet(ACTOR_BINARY[4]);
    config.radius = view.autoGet(ACTOR_BINARY[5]);
    config.mass = view.autoGet(ACTOR_BINARY[6]);
    config.flags = view.autoGet(ACTOR_BINARY[7]);
    config.crazyTime = view.autoGet(ACTOR_BINARY[8]);
    config.peppers = view.autoGet(ACTOR_BINARY[9]);
    config.fastPercent = view.autoGet(ACTOR_BINARY[10]);
    return config;
  },

  getRemoveConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:ActorRemoveConfig = this.removePool.alloc();
    view.index = offset;
    config.id = view.autoGet(BINARY.UInt16);
    config.assasin = view.autoGet(BINARY.Int16);
    return config;
  }
};
