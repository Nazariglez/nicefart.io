/**
 * Created by nazarigonzalez on 3/7/16.
 */
import config from '../config';
import {linearInterpolator} from "../../common/utils";
import ObjPool from "obj-pool";
import {ENTITY_TYPE} from "../../common/interfaces";
import {FoodStateConfig, FoodHelper, FoodUpdateConfig} from "../helpers/FoodHelper";

const rot20:number = 20*PIXI.DEG_TO_RAD;
const rot20_2:number = rot20*2;

const textures:string[] = ["B_1.png", "B_2.png", "B_3.png", "B_4.png", "B_5.png", "B_6.png", "B_7.png", "B_8.png", "B_9.png", "B_10.png"];
const REMOVED_TIME:number = 0.5;
const CREATE_TIME:number = 0.6;

export default class DisplayFood extends PIXI.Sprite{
  static pool:ObjPool<any> = new ObjPool(DisplayFood, {amount:100});
  private _data:FoodStateConfig[] = [];
  private _rotPingPong:boolean = false;
  private _scalePingPong:boolean = false;
  private _addRot:number;

  private _removed:boolean = false;
  private _removedTime:number = 0;
  private _removedPosition:PIXI.Point = new PIXI.Point();
  private _removedSize:number = 0;
  private _assasin:PIXI.Sprite;

  private _creating:boolean = false;
  private _createTime:number = 0;
  private _createSize:number = 0;

  entityType:ENTITY_TYPE = ENTITY_TYPE.FOOD;
  mass:number = 0;
  
  constructor() {
    super(null);
    this.anchor.set(0.5);
    this._addRot = 40 * PIXI.DEG_TO_RAD;
    this.rotation = -rot20 + Math.floor(Math.random()*rot20_2);
    this._rotPingPong = !!Math.round(Math.random());
    this._scalePingPong = !!Math.round(Math.random());
  }

  initialize(basicFood?:boolean){
    let texture = basicFood ? textures[0] : textures[Math.floor(Math.random() * textures.length)];
    this.alpha = 1;
    this.texture = PIXI.loader.resources["beans"].textures[texture];
    this.anchor.set(0.5);
    this._addRot = 40 * PIXI.DEG_TO_RAD;
    this.rotation = -rot20 + Math.floor(Math.random()*rot20_2);
    this._rotPingPong = !!Math.round(Math.random());
    this._scalePingPong = !!Math.round(Math.random());
  }

  createEffect(){
    this._createTime = CREATE_TIME;
    this._creating = true;
    this._createSize = this.width;
  }

  reset(){
    this._data.length = 0;
    this._addRot = 0;
    this._rotPingPong = false;
    this._scalePingPong = false;
    this.rotation = 0;
    this.scale.set(0);
    this.position.set(0);
    this._removed = false;
    this._assasin = null;
    this._removedPosition.set(0);
    this.alpha = 1;
    this._creating = false;
  }

  addData(delta:number, data:FoodUpdateConfig){
    if(config.game.interpolation){
      const state:FoodStateConfig = FoodHelper.statePool.alloc();
      state.time = 0;
      state.totalTime = delta;
      state.data = data;
      this._data.push(state);
      if(this._data.length > 5){
        const _state:FoodStateConfig = this._data.shift();
        FoodHelper.statePool.free(_state);
      }
    }else{
      this.__setCurrentData(data);
    }
  }

  update(delta:number){
    super.update(delta);
    if(this._removed){
      if(this._removedTime > 0 && this._assasin){
        this._removedTime -= delta;
        this.position.x = linearInterpolator(this._assasin.position.x, this._removedPosition.x, REMOVED_TIME, this._removedTime);
        this.position.y = linearInterpolator(this._assasin.position.y, this._removedPosition.y, REMOVED_TIME, this._removedTime);
        this.alpha = linearInterpolator(0, 1, REMOVED_TIME, this._removedTime);
        this.width = this.height = linearInterpolator(0, this._removedSize, REMOVED_TIME, this._removedTime);
      }else if(this._removedTime <= 0 || !this._assasin){
        this._removed = false;
        this.hide();
      }
      return;
    }

    if(this._creating){
      if(this._createTime > 0){
        this._createTime -= delta;
        this.alpha = linearInterpolator(1, 0.2, CREATE_TIME, this._createTime);
        this.width = this.height = linearInterpolator(this._createSize, this._createSize*0.2, CREATE_TIME, this._createTime);
      }else{
        this._creating = false;
      }
    }

    if(config.game.interpolation && this._data.length >= 2){
      this.__interpolate(delta);
    }

    if(config.game.effects) {
      if ((!this._rotPingPong && this.rotation >= rot20_2) || (this._rotPingPong && this.rotation <= -rot20)) {
        this._rotPingPong = !this._rotPingPong;
        this._scalePingPong = !this._scalePingPong;
      }

      const n:number = this._addRot * delta;
      this.rotation += this._rotPingPong ? -n : n;
      this.scale.set(this._scalePingPong ? this.scale.x + 0.03 * delta : this.scale.x - 0.03 * delta);
    }
  }

  hide(assasin?:PIXI.Sprite){
    if(assasin){
      this._removedTime = REMOVED_TIME;
      this._removed = true;
      this._assasin = assasin;
      this._removedPosition.copy(this.position);
      this._removedSize = this.width;
    }else{
      this.parent.removeChild(this);
      DisplayFood.pool.free(this);
    }
  }

  private __interpolate = (delta:number)=>{
    const prev:any = this._data[0];
    const current:any = this._data[1];
    prev.time += delta;

    this.position.x = linearInterpolator(prev.data.x, current.data.x, current.totalTime, prev.time);
    this.position.y = linearInterpolator(prev.data.y, current.data.y, current.totalTime, prev.time);

    if(prev.time >= current.totalTime){
      let offset:number = prev.time - current.totalTime;

      const _state:FoodStateConfig = this._data.shift();
      FoodHelper.statePool.free(_state);

      if(offset&&this._data.length >= 2){
        this.__interpolate(offset);
      }
    }
  };

  private __setCurrentData(data:FoodUpdateConfig){
    this.position.x = data.x;
    this.position.y = data.y;
  }
}