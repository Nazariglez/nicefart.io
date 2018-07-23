/**
 * Created by nazarigonzalez on 28/6/16.
 */
import Point from './Point';
import {FOOD_DATA, ENTITY_TYPE} from "../common/interfaces";
import * as rbush from "rbush";
import ObjPool from "obj-pool";
import {interpolate, Easing} from "./interpolator";
import {arrayPool} from "../common/utils";

enum STATE {
  BORN, ALIVE, DEAD
}

export enum TYPE {
  FOOD, FIRE
}

const rad55:number = 55*Math.PI/180;
const OUT_TIME:number = 5.5;
const MIN_RADIUS:number = 31;
const MAX_RADIUS:number = 80;
const MAX_MASS_RELATIVE_RADIUS:number = 410;

export class Food {
  static pool: ObjPool<any> = new ObjPool(Food);
  static STATE = STATE;
  static TYPE = TYPE;

  static calculateRadius(mass: number) {
    if(mass === 1)return 22;
    return mass > MAX_MASS_RELATIVE_RADIUS ? MAX_RADIUS : interpolate(MIN_RADIUS, MAX_RADIUS, MAX_MASS_RELATIVE_RADIUS, mass, Easing.outExpo());
  };

  private _state: STATE = STATE.ALIVE;
  protected _type: TYPE = TYPE.FOOD;
  private _vectorSpeed: Point = new Point();
  protected _angle: number = 0;
  protected _speed: number = 0;
  private _decreaseSpeed: number = 0;
  private _outTime: number = OUT_TIME;
  private _out: boolean = false;
  private _mass: number = 0;
  private _radius: number = 0;

  id: number;
  position: Point = new Point();
  box: rbush.ItemInterface = {minX: 0, minY: 0, maxX: 0, maxY: 0, id: -1};

  constructor() {
  }

  initialize(id: number, mass?: number) {
    if (!mass) {
      this.mass = 1;// + Math.floor(Math.random() * 2);
    } else {
      this.mass = mass;
    }

    this.id = id;
    this.box["id"] = this.id;
  }

  reset() {
    this.id = -1;
    this.mass = 0;
    this.box.minX = 0;
    this.box.minY = 0;
    this.box.maxX = 0;
    this.box.maxY = 0;
    this.box["id"] = -1;
    this.state = Food.STATE.ALIVE;
    this._angle = 0;
    this._speed = 0;
    this.position.set(0);
    this._vectorSpeed.set(0);
    this._out = false;
    this._decreaseSpeed = 0;
    this._outTime = OUT_TIME;
  }

  onExpireOut(food: Food) {
  }

  setMovement(angle, speed) {
    this._state = STATE.BORN;
    const min: number = -rad55 + angle;
    this._angle = min + (Math.random() * (rad55 * 2));
    this.speed = speed + interpolate(0, 200, MAX_MASS_RELATIVE_RADIUS, this._mass);
    this._decreaseSpeed = speed * 0.8;
  }

  fixPosition(delta: number, xBound: number, yBound: number) {
    if (this._out)return;
    if (this.position.x < -xBound || this.position.x > xBound || this.position.y < -yBound || this.position.y > yBound) {
      this._out = true;
    }
  }

  update(delta) {
    if (this._state === STATE.BORN) {
      if(this.speed <= 20){
        this._state = STATE.ALIVE;
      }
    }

    if (this.speed > 0) {
      this.position.x += this._vectorSpeed.x * delta;
      this.position.y += this._vectorSpeed.y * delta;

      this.speed -= this._decreaseSpeed * delta;
    }

    if (this._out) {
      this._outTime -= delta;
      if (this._outTime <= 0 && this._state === STATE.ALIVE) {
        this.onExpireOut(this);
      }
    }
  }

  updateBox() {
    this.box.minX = this.position.x - this.radius;
    this.box.minY = this.position.y - this.radius;
    this.box.maxX = this.position.x + this.radius;
    this.box.maxY = this.position.y + this.radius;
  }

  toArray(): FOOD_DATA {
    let arr: any[] = arrayPool.alloc();
    arr[0] = this.id;
    arr[1] = ENTITY_TYPE.FOOD;
    arr[2] = Math.round(this.mass);
    arr[3] = Math.round(this.position.x);
    arr[4] = Math.round(this.position.y);
    arr[5] = Math.round(this.radius);
    return arr as FOOD_DATA;
  }

  get state(): STATE {
    return this._state;
  };

  set state(value: STATE) {
    if (value !== this._state) {
      this._state = value;
    }
  }

  get speed(): number {
    return this._speed;
  };

  set speed(value: number) {
    if (value !== this._speed) {
      const cosX: number = Math.cos(this._angle);
      const sinY: number = Math.sin(this._angle);
      this._vectorSpeed.set(
        value * cosX,
        value * sinY
      );
      this._speed = value;
    }
  }

  get type(): TYPE {
    return this._type;
  };

  get mass(): number {
    return this._mass;
  };

  set mass(value: number) {
    if (value !== this._mass) {
      this._mass = value;
      this._radius = Food.calculateRadius(this._mass);
    }
  }

  get radius(): number {
    return this._radius;
  };
}