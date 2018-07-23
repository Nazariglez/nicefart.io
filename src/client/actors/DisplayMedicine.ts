/**
 * Created by nazarigonzalez on 18/7/16.
 */
import config from '../config';
import {linearInterpolator} from "../../common/utils";
import ObjPool from "obj-pool";
import {ENTITY_TYPE} from "../../common/interfaces";
import {MedicineStateConfig, MedicineUpdateConfig, MedicineHelper} from "../helpers/MedicineHelper";
import GameScene from "../scenes/GameScene";

const colors:number[] = [0xffffff, 0xff00ff, 0xff0000, 0xf0ff00, 0xa1a1f0];

export default class DisplayMedicine extends PIXI.Sprite {
  static pool:ObjPool<any> = new ObjPool(DisplayMedicine, {amount:5});
  private _data:MedicineStateConfig[] = [];

  entityType:ENTITY_TYPE = ENTITY_TYPE.MEDICINE;
  mass:number = 0;

  constructor(){
    super(null);
    this.anchor.set(0.5);
  }

  initialize(scene:GameScene){
    this.texture = PIXI.loader.resources["nicefart1"].textures["suppository.png"];

    this.anchor.set(0.75, 0.5);
    this._data.length = 0;
    this.rotation = 0;
    this.scale.set(0);
    //this.tint = colors[Math.floor(Math.random()*colors.length)] || 0xffffff;
  }

  addData(delta:number, data:MedicineUpdateConfig){
    if(config.game.interpolation){
      const state:MedicineStateConfig = MedicineHelper.statePool.alloc();
      state.time = 0;
      state.totalTime = delta;
      state.data = data;
      this._data.push(state);
      if(this._data.length > 5){
        const _state:MedicineStateConfig = this._data.shift();
        MedicineHelper.statePool.free(_state);
      }
    }else{
      this.__setCurrentData(data);
    }
  }

  update(delta:number){
    super.update(delta);
    if(config.game.interpolation && this._data.length >= 2){
      this.__interpolate(delta);
    }
  }

  hide(){
    if(this.parent){
      this.parent.removeChild(this);
      DisplayMedicine.pool.free(this);
    }
  }

  private __interpolate = (delta:number)=>{
    const prev:any = this._data[0];
    const current:any = this._data[1];
    prev.time += delta;

    this.rotation = PIXI.DEG_TO_RAD * linearInterpolator(prev.data.angle, current.data.angle, current.totalTime, prev.time);
    this.position.x = linearInterpolator(prev.data.x, current.data.x, current.totalTime, prev.time);
    this.position.y = linearInterpolator(prev.data.y, current.data.y, current.totalTime, prev.time);

    if(prev.time >= current.totalTime){
      let offset:number = prev.time - current.totalTime;

      const _state:MedicineStateConfig = this._data.shift();
      MedicineHelper.statePool.free(_state);

      if(offset&&this._data.length >= 2){
        this.__interpolate(offset);
      }
    }
  };

  private __setCurrentData(data:MedicineUpdateConfig){
    this.rotation = data.angle;
    this.position.x = data.x;
    this.position.y = data.y;
  }
}