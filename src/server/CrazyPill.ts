/**
 * Created by nazarigonzalez on 15/7/16.
 */
import Point from "./Point";
import {POWER_UP_DATA, ENTITY_TYPE} from "../common/interfaces";
import * as rbush from "rbush";
import ObjPool from "obj-pool";
import {arrayPool} from "../common/utils";

enum STATE {
  BORN, ALIVE, DEAD
}

const RADIUS:number = 32;

export default class CrazyPill {
  static pool:ObjPool<any> = new ObjPool(CrazyPill);
  static STATE = STATE;

  private _state:STATE = STATE.BORN;
  private _speedMin:number = 400;
  private _speedMax:number = 750;
  private _speed:number = 0;
  private _angle:number = 0;

  private _vectorSpeed:Point = new Point();
  private _changeMovementTimer:number = 0;

  position:Point = new Point();
  radius:number = RADIUS;
  box:rbush.ItemInterface = {minX: 0, minY: 0, maxX: 0, maxY: 0, id:-1};
  id:number;

  constructor(){}

  initialize(id:number, angle?:number, speed?:number){
    this.id = id;

    if(angle){
      this._speed = speed;
      this._angle = angle;
      this._changeMovementTimer = 1;
      this.__calcSpeed();
    }else{
      this.setRandomParams();
    }

    this.box["id"] = this.id;
  }

  reset(){
    this._state = STATE.BORN;
    this._speed = 0;
    this._angle = 0;
    this._vectorSpeed.set(0);
    this.position.set(0);
    this._changeMovementTimer = 0;
    this.radius = RADIUS;
    this.id = -1;
    this.box.minX = 0;
    this.box.minY = 0;
    this.box.maxX = 0;
    this.box.maxY = 0;
    this.box["id"] = -1;
  }

  update(delta:number){
    this.position.x += this._vectorSpeed.x*delta;
    this.position.y += this._vectorSpeed.y*delta;

    this._changeMovementTimer -= delta;
    if(this._changeMovementTimer <= 0){
      this.setRandomParams();
    }
  }

  updateBox(){
    this.box.minX = this.position.x - this.radius;
    this.box.minY = this.position.y - this.radius;
    this.box.maxX = this.position.x + this.radius;
    this.box.maxY = this.position.y + this.radius;
  }

  setRandomParams(){
    if(this._state === STATE.BORN)this._state = STATE.ALIVE;

    this._angle = Math.floor(Math.random()*360) * Math.PI/180;
    this._speed = this._speedMin + Math.round(Math.random() * (this._speedMax-this._speedMin));
    this._changeMovementTimer = 1 + Math.random() * 3; //seconds
    this.__calcSpeed();
  }

  fixPosition(delta:number, xBound:number, yBound:number){
    let change:boolean = false;

    if(this.position.x < -xBound){
      this.position.x = -xBound;
      change = true;
    }else if(this.position.x > xBound){
      this.position.x = xBound;
      change = true;
    }

    if(this.position.y < -yBound){
      this.position.y = -yBound;
      change = true;
    }else if(this.position.y > xBound){
      this.position.y = yBound;
      change = true;
    }

    if(change){
      this.setRandomParams();
    }
  }

  toArray():POWER_UP_DATA{
    let arr:any[] = arrayPool.alloc();
    arr[0] = this.id;
    arr[1] = ENTITY_TYPE.POWER_UP;
    arr[2] = Math.round(this.position.x);
    arr[3] = Math.round(this.position.y);
    arr[4] = Math.round(this.radius);
    return arr as POWER_UP_DATA;
  }

  private __calcSpeed(){
    const cosX:number = Math.cos(this._angle);
    const sinY:number = Math.sin(this._angle);

    this._vectorSpeed.set(
      this._speed * cosX,
      this._speed * sinY
    );
  }

  get state():STATE {return this._state;};
  set state(value:STATE){
    if(value !== this._state){
      this._state = value;
    }
  }
}
