/**
 * Created by nazarigonzalez on 3/7/16.
 */
import {Food, TYPE} from "./Food";
import {Actor} from "./Actor";
import {FOOD_DATA, FART_SHOOT_DATA, ENTITY_TYPE} from "../common/interfaces";
import * as rbush from "rbush";
import ObjPool from "obj-pool";
import {interpolate, Easing} from './interpolator';
import {arrayPool} from "../common/utils";

export const TOTAL_TIME:number = 0.7;
const EXPIRE_TIME:number = 6;
const MIN_RADIUS:number = 11;
const MAX_RADIUS:number = 60;
const MAX_MASS_RELATIVE_RADIUS:number = 350;

export default class FartShoot extends Food{ //todo: maybe remove the inherit from food?
  static pool:ObjPool<any> = new ObjPool(FartShoot);
  static calculateRadius(mass:number){return mass > MAX_MASS_RELATIVE_RADIUS ? MAX_RADIUS : interpolate(MIN_RADIUS, MAX_RADIUS, MAX_MASS_RELATIVE_RADIUS, mass, Easing.outExpo());};

  private _elapsed:number = 0;
  private _cosX:number = 0;
  private _sinY:number = 0;

  private _onMovement:boolean = true;

  id:number;
  owner:Actor;
  box:rbush.ItemInterface = {minX: 0, minY: 0, maxX: 0, maxY: 0, id:-1};

  constructor(){
    super();
  }

  initialize(id:number, mass?:number){
    super.initialize(id, mass);
    this._type = TYPE.FIRE;
    this.box["id"] = this.id;
  }

  reset(){
    super.reset();
    this._onMovement = true;
    this.state = FartShoot.STATE.ALIVE;
    this._elapsed = 0;
    this._cosX = 0;
    this._sinY = 0;
    this.owner = null;
  }

  isSafeFor(actor:Actor){
    //owner can't hit meanwhile the fart is on movement
    return (this._onMovement && actor === this.owner);
  }

  onExpire(fire:FartShoot){}

  setDestintation(owner:Actor, x1:number, y1:number, speed:number, angle:number){
    this.owner = owner;
    this.position.set(x1,y1);
    const speedRange:number = interpolate(0.3, 0, 600, owner.radius);
    this._speed = speed + 500 + (owner.radius*(1.7+speedRange)/(TOTAL_TIME-0.1));
    this._angle = angle;
    this._cosX = Math.cos(this._angle);
    this._sinY = Math.sin(this._angle);
  }

  update(delta:number){
    const time:number = TOTAL_TIME;
    const expireTime:number = EXPIRE_TIME;

    if(this._elapsed < time){
      const speed:number = interpolate(this._speed, 0, time, this._elapsed);
      this.position.x += (speed*this._cosX)*delta;
      this.position.y += (speed*this._sinY)*delta;
    }else if(this._onMovement){
      this._onMovement = false;
    }

    if(this._elapsed >= expireTime){
      this.onExpire(this);
    }

    this._elapsed += delta;
  }

  updateBox(){
    this.box.minX = this.position.x - this.radius;
    this.box.minY = this.position.y - this.radius;
    this.box.maxX = this.position.x + this.radius;
    this.box.maxY = this.position.y + this.radius;
  }

  toArray():FART_SHOOT_DATA{
    let arr:any[] = arrayPool.alloc();
    arr[0] = this.id;
    arr[1] = ENTITY_TYPE.FART_SHOOT;
    arr[2] = Math.round(this.mass);
    arr[3] = Math.round(this.position.x);
    arr[4] = Math.round(this.position.y);
    arr[5] = Math.round(this.radius);
    arr[6] = this.owner.id;
    return arr as FART_SHOOT_DATA;
  }

  get radius():number {
    return FartShoot.calculateRadius(this.mass);
  }
}
