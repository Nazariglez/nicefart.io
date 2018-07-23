/**
 * Created by nazarigonzalez on 3/7/16.
 */
import config from '../config';
import {linearInterpolator} from "../../common/utils";
import ObjPool from "obj-pool";
import {ENTITY_TYPE} from "../../common/interfaces";
import {FartShootStateConfig, FartShootHelper, FartShootUpdateConfig} from "../helpers/FartShootHelper";

const textures:string[] = [
  "fart00.png", "fart01.png", "fart02.png",
  "fart03.png", "fart04.png", "fart05.png",
  "fart06.png", "fart07.png", "fart08.png"
];

export default class DisplayFartShoot extends PIXI.Sprite{
  static pool:ObjPool<any> = new ObjPool(DisplayFartShoot, {amount:5});
  private _data:FartShootStateConfig[] = [];
  private _animTextures:PIXI.Texture[];
  private _frameIndex:number = 0;
  private _animationTime:number = 1;
  private _animationCounter:number = 0;

  entityType:ENTITY_TYPE = ENTITY_TYPE.FART_SHOOT;
  mass:number = 0;
  
  constructor() {
    super(null);
    this.anchor.set(0.5);
  }

  initialize(){
    this.texture = PIXI.loader.resources["nicefart1"].textures[textures[0]];
    this.anchor.set(0.5);
    if(!this._animTextures){
      this._animTextures = textures.map((t)=>PIXI.loader.resources["nicefart1"].textures[t]);
    }
  }

  reset(){
    this._data.length = 0;
    this._frameIndex = 0;
    this._animationTime = 1;
    this._animationCounter = 0;
    this.mass = 0;
    this.texture = PIXI.loader.resources["nicefart1"].textures[textures[0]];
  }

  addData(delta:number, data:FartShootUpdateConfig){
    if(config.game.interpolation){
      const state:FartShootStateConfig = FartShootHelper.statePool.alloc();
      state.time = 0;
      state.totalTime = delta;
      state.data = data;
      this._data.push(state);
      if(this._data.length > 5){
        const _state:FartShootStateConfig = this._data.shift();
        FartShootHelper.statePool.free(_state);
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

    this.__runAnimation(delta);
  }

  hide(){
    this.parent.removeChild(this);
    DisplayFartShoot.pool.free(this);
  }

  private __runAnimation(delta){
    this._animationCounter += delta;
    const len:number = this._animTextures.length;
    const index:number = Math.floor((this._animationCounter*len)/this._animationTime)%(len-1);
    if(index !== this._frameIndex){
      this._frameIndex = index;
      this.texture = this._animTextures[this._frameIndex];
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

      const _state:FartShootStateConfig = this._data.shift();
      FartShootHelper.statePool.free(_state);

      if(offset&&this._data.length >= 2){
        this.__interpolate(offset);
      }
    }
  };

  private __setCurrentData(data:FartShootUpdateConfig){
    this.position.x = data.x;
    this.position.y = data.y;
  }
}