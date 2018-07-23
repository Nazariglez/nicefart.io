/**
 * Created by nazarigonzalez on 15/7/16.
 */
import config from '../config';
import {linearInterpolator} from "../../common/utils";
import ObjPool from "obj-pool";
import {ENTITY_TYPE} from "../../common/interfaces";
import {PowerUpStateConfig, PowerUpHelper, PowerUpUpdateConfig} from "../helpers/PowerUpHelper";
import GameScene from "../scenes/GameScene";

const rot:number = 100*PIXI.DEG_TO_RAD;

export class DisplayPowerUp extends PIXI.Sprite {
  static pool:ObjPool<any> = new ObjPool(DisplayPowerUp, {amount:5});
  private _data:PowerUpStateConfig[] = [];
  private _tween:PIXI.tween.Tween;
  private _powerType:number = 0;

  entityType:ENTITY_TYPE = ENTITY_TYPE.POWER_UP;
  mass:number = 99;

  constructor(){
    super(null);
  }

  initialize(scene:GameScene){
    //this.texture = PIXI.loader.resources["starGold"].texture;
    this.tint = 0xffffff;
    this.anchor.set(0.5);
  }

  reset(){
    this._data.length = 0;
    this.mass = 99;
    this.scale.set(1);
    this.rotation = 0;
    if(this._tween) {
      this._tween.stop();
      this._tween.reset();
    }
  }

  addTween(tween:PIXI.tween.Tween){
    this._tween = tween;
    this._tween.pingPong = true;
    this._tween.loop = true;
    this._tween.from({
      width: this.width*0.8,
      height: this.height*0.8
    });
    this._tween.to({
      width: this.width*1.2,
      height: this.height*1.2
    });
    this._tween.time = 1000;
    this._tween.start();
  }

  addData(delta:number, data:PowerUpUpdateConfig){
    if(config.game.interpolation){
      const state:PowerUpStateConfig = PowerUpHelper.statePool.alloc();
      state.time = 0;
      state.totalTime = delta;
      state.data = data;
      this._data.push(state);
      if(this._data.length > 5){
        const _state:PowerUpStateConfig = this._data.shift();
        PowerUpHelper.statePool.free(_state);
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
    this.rotation += rot*delta;
  }

  hide(){
    this.parent.removeChild(this);
    DisplayPowerUp.pool.free(this);
  }

  private __interpolate = (delta:number)=>{
    const prev:any = this._data[0];
    const current:any = this._data[1];
    prev.time += delta;

    this.position.x = linearInterpolator(prev.data.x, current.data.x, current.totalTime, prev.time);
    this.position.y = linearInterpolator(prev.data.y, current.data.y, current.totalTime, prev.time);

    if(prev.time >= current.totalTime){
      let offset:number = prev.time - current.totalTime;

      const _state:PowerUpStateConfig = this._data.shift();
      PowerUpHelper.statePool.free(_state);

      if(offset&&this._data.length >= 2){
        this.__interpolate(offset);
      }
    }
  };

  private __setCurrentData(data:PowerUpUpdateConfig){
    this.position.x = data.x;
    this.position.y = data.y;
  }

  get tween():PIXI.tween.Tween{return this._tween;};

  set powerType(v:number){
    if(v !== this._powerType){
      this._powerType = v;
    }

    switch(this._powerType){
      case 0:
        this.texture = PIXI.loader.resources["nicefart1"].textures["starGold.png"];
        break;
      case 1:
        this.texture = PIXI.loader.resources["nicefart1"].textures["Guindilla_260x260.png"];
        break;
      case 2:
        this.texture = PIXI.loader.resources["nicefart1"].textures["x2.png"];
        this.tint = 0xED9F1D;
        break;
      case 3:
        this.texture = PIXI.loader.resources["nicefart1"].textures["x3.png"];
        this.tint = 0xED5849;
        break;
      default:
        this.texture = PIXI.loader.resources["nicefart1"].textures["starGold.png"];
        break;
    }
  }
}