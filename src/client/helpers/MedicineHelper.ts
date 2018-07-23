/**
 * Created by nazarigonzalez on 26/8/16.
 */
import {ENTITY_TYPE, MEDICINE_BINARY} from "../../common/interfaces";
import {LiteralObjectPool} from "../../common/LiteralObjectPool";
import {BufferView} from "../../common/Binary";

export interface MedicineCreateConfig {
  id:number;
  type:ENTITY_TYPE;
  angle:number;
  x:number;
  y:number;
  radius:number;
}

export interface MedicineUpdateConfig {
  id:number;
  angle:number;
  x:number;
  y:number;
}

export interface MedicineStateConfig {
  time:number;
  totalTime:number;
  data:MedicineUpdateConfig;
}

export interface MedicineConfigHelper {
  createPool:LiteralObjectPool<MedicineCreateConfig>;
  updatePool:LiteralObjectPool<MedicineUpdateConfig>;
  statePool:LiteralObjectPool<MedicineStateConfig>;
  getCreateConfigFromBuffer:(buffer:BufferView, offset:number)=>MedicineCreateConfig;
  getUpdateConfigFromBuffer:(buffer:BufferView, offset:number)=>MedicineUpdateConfig;
}

export const medicineCreateConfig:MedicineCreateConfig = {
  id:null,
  type:null,
  angle:null,
  x:null,
  y:null,
  radius:null
};

export const medicineUpdateConfig:MedicineUpdateConfig = {
  id:null,
  angle:null,
  x:null,
  y:null
};

export const medicineStateConfig:MedicineStateConfig = {
  time:null,
  totalTime:null,
  data:null
};

let medicineCreateConfigPool:LiteralObjectPool<MedicineCreateConfig> = new LiteralObjectPool(medicineCreateConfig, 10);
medicineCreateConfigPool.resetCallback = function(obj:MedicineCreateConfig){
  obj.id = null;
  obj.type = null;
  obj.angle = null;
  obj.x = null;
  obj.y = null;
  obj.radius = null;
};

let medicineUpdateConfigPool:LiteralObjectPool<MedicineUpdateConfig> = new LiteralObjectPool(medicineUpdateConfig, 10);
medicineUpdateConfigPool.resetCallback = function(obj:MedicineUpdateConfig){
  obj.id = null;
  obj.angle = null;
  obj.x = null;
  obj.y = null;
};

let medicineStatePool:LiteralObjectPool<MedicineStateConfig> = new LiteralObjectPool(medicineStateConfig, 10);
medicineStatePool.resetCallback = function(obj:MedicineStateConfig){
  obj.time = null;
  obj.totalTime = null;
  medicineUpdateConfigPool.free(obj.data);
  obj.data = null;
};

export const MedicineHelper:MedicineConfigHelper = {
  createPool: medicineCreateConfigPool,
  updatePool: medicineUpdateConfigPool,
  statePool: medicineStatePool,

  getCreateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:MedicineCreateConfig = this.createPool.alloc();
    view.index = offset;
    config.id = view.autoGet(MEDICINE_BINARY[0]);
    config.type = view.autoGet(MEDICINE_BINARY[1]);
    config.angle = view.autoGet(MEDICINE_BINARY[2]);
    config.x = view.autoGet(MEDICINE_BINARY[3]);
    config.y = view.autoGet(MEDICINE_BINARY[4]);
    config.radius = view.autoGet(MEDICINE_BINARY[5]);
    return config;
  },

  getUpdateConfigFromBuffer: function(view:BufferView, offset:number = 0){
    let config:MedicineUpdateConfig = this.updatePool.alloc();
    view.index = offset;
    config.id = view.autoGet(MEDICINE_BINARY[0]);
    config.angle = view.autoGet(MEDICINE_BINARY[2]);
    config.x = view.autoGet(MEDICINE_BINARY[3]);
    config.y = view.autoGet(MEDICINE_BINARY[4]);
    return config;
  }
};