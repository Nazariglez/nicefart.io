/**
 * Created by nazarigonzalez on 15/7/16.
 */
import Point from "./Point";
import {MEDICINE_DATA, ENTITY_TYPE} from "../common/interfaces";
import {Actor} from "./Actor";
import * as rbush from "rbush";
import ObjPool from "obj-pool";
import {arrayPool} from "../common/utils";

enum STATE {
  BORN, ALIVE, DEAD
}

const RADAR_TIME:number = 1;
const RAD_TO_DEG:number = 180/Math.PI;
const RAD:number = 2*Math.PI;
const rad180:number = Math.PI;
const RADIUS:number = 75;
export const MEDICINE_SEARCH_DISTANCE:number = 0.25;
const TIME_TO_RESPAWN:number = 90;
const SPEED_MIN = 50;
const SPEED_MAX = 130;

export class Medicine {
  static pool:ObjPool<any> = new ObjPool(Medicine);
  static STATE = STATE;

  private _state:STATE = STATE.BORN;
  private _speedMin:number = SPEED_MIN;
  private _speedMax:number = SPEED_MAX;
  private _speed:number = 0;
  private _angle:number = 0;

  private _vectorSpeed:Point = new Point();
  private _changeMovementTimer:number = 0;
  private _target:Actor;
  private _targetRadarTime:number = 0;
  private _dirty:boolean = false;
  private _distance:number;

  position:Point = new Point();
  radius:number = RADIUS;
  angleDir:number = 0;
  box:rbush.ItemInterface = {minX: 0, minY: 0, maxX: 0, maxY: 0, id:-1};
  id:number;
  mapSize:number;

  timeToRespawn:number = 0;
  searchTime:number = 0;

  constructor(){}

  initialize(id:number, mapSize:number){
    this.id = id;
    this.mapSize = mapSize;
    this._distance = mapSize*MEDICINE_SEARCH_DISTANCE;
    this._speedMax = SPEED_MAX + (Math.random()*30);
    this.setRandomParams();

    this.box["id"] = this.id;
  }

  reset(){
    this.id = -1;
    this.mapSize = 0;
    this.radius = RADIUS;
    this._speed = 0;
    this._angle = 0;
    this.angleDir = 0;
    if(this._target){
      this._target.findingByMedicine = -1;
    }
    this._target = null;
    this._vectorSpeed.set(0);
    this._changeMovementTimer = 0;
    this._targetRadarTime = 0;
    this._dirty = false;
    this._distance = 0;
    this.position.set(0);
    this.timeToRespawn = 0;
    this.searchTime = 0;
  }

  die(){
    this.state = STATE.DEAD;
    this.timeToRespawn = TIME_TO_RESPAWN + Math.random()*30;
  }

  update(delta:number){
    if(this.state === STATE.DEAD){
      this.timeToRespawn -= delta;
      return;
    }

    this.position.x += this._vectorSpeed.x*delta;
    this.position.y += this._vectorSpeed.y*delta;

    if(this._target){

      if(this._target.state === Actor.STATE.DEAD || this._target.crazy){
        //console.log('LOST TARGET', this._target.name);
        this._target.findingByMedicine = -1;
        this._target = null;
        this.setRandomParams();
      }else{

        this._targetRadarTime -= delta;
        if(this._targetRadarTime <= 0){
          const a:number = this.position.x - this._target.position.x;
          const b:number = this.position.y - this._target.position.y;
          const distance:number = Math.abs(Math.sqrt(a*a + b*b));

          if(distance > this._distance + this._target.radius){
            //console.log('LOST TARGET', this._target.name);
            this._target.findingByMedicine = -1;
            this._target = null;
            this.setRandomParams();
          }else{
            this.angleDir = Math.atan2(this._target.position.y - this.position.y, this._target.position.x - this.position.x)%RAD;
          }
        }

      }
    }else{
      this._changeMovementTimer -= delta;
      if(this._changeMovementTimer <= 0){
        this.setRandomParams();
      }
    }

    if(this.angleDir !== this._angle){
      if(this._angle < this.angleDir){
        this._angle = (this._angle + rad180*delta)%RAD;
        if(this._angle > this.angleDir)this._angle=this.angleDir;
      }else{
        this._angle = (this._angle - rad180*delta)%RAD;
        if(this._angle < this.angleDir)this._angle=this.angleDir;
      }
      this._dirty = true;
    }

    if(this._dirty)this.__calcSpeed();
  }

  updateBox(){
    this.box.minX = this.position.x - this.radius;
    this.box.minY = this.position.y - this.radius;
    this.box.maxX = this.position.x + this.radius;
    this.box.maxY = this.position.y + this.radius;
  }

  setRandomParams(){
    if(this._state === STATE.BORN)this._state = STATE.ALIVE;
    this.angleDir = (Math.floor(Math.random()*360) * Math.PI/180)%RAD;
    this._speed = this._speedMin;
    this._changeMovementTimer = 3 + Math.random() * 6; //seconds
    this.__calcSpeed();
  }

  setTarget(target:Actor){
    if(this._target){
      this._target.findingByMedicine = -1;
    }

    this._targetRadarTime = RADAR_TIME;
    this._target = target;
    this._target.findingByMedicine = this.id;
    this._speed = this._speedMax;
    this.angleDir = Math.atan2(this._target.position.y - this.position.y, this._target.position.x - this.position.x)%RAD;
    this.__calcSpeed();
    //console.log('## Search target', this._target.name);
  }

  isBestTarget(target:Actor):boolean {
    if(!this._target||this._target.state === Actor.STATE.DEAD||target.crazy)return true;
    return target.mass > this._target.mass;
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

  toArray():MEDICINE_DATA{
    let arr:any[] = arrayPool.alloc();
    arr[0] = this.id;
    arr[1] = ENTITY_TYPE.MEDICINE;
    arr[2] = Math.round(this._angle*RAD_TO_DEG);
    arr[3] = Math.round(this.position.x);
    arr[4] = Math.round(this.position.y);
    arr[5] = Math.round(this.radius);
    return arr as MEDICINE_DATA;
  }

  private __calcSpeed(){
    const cosX:number = Math.cos(this._angle);
    const sinY:number = Math.sin(this._angle);

    this._vectorSpeed.set(
      this._speed * cosX,
      this._speed * sinY
    );

    this._dirty = false;
  }

  get state():STATE {return this._state;};
  set state(value:STATE){
    if(value !== this._state){
      this._state = value;
    }
  }

  get target():Actor{return this._target;};
}
