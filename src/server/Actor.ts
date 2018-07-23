/**
 * Created by nazarigonzalez on 20/6/16.
 */
import {WebsocketConnection} from "./core/WebsocketConnection";
import Point from "./Point";
import {getRandomBotName} from "./botnames";
import {Food} from "./Food";
import {ACTOR_DATA, ENTITY_TYPE, ACTOR_FLAG} from "../common/interfaces";
import * as rbush from "rbush";
import ObjPool from "obj-pool";
import {generateSkinConfig} from "../common/skins";
import {Easing, interpolate} from "./interpolator";
import {arrayPool, crazyEffectTime, linearInterpolator} from "../common/utils";

const MAX_MASS:number = 40000;
const FIRE_TIME:number = 1.2;
const SLOW_TIME:number = 0.5;
const BOUND_DEATH_TIME:number = 4;
const CRAZY_TIME:number = crazyEffectTime;
const CRAZY_DELAY:number = 0.3; //time between stars

const MIN_RADIUS:number = 10;
const MAX_RADIUS:number = 600;
const MAX_MASS_RELATIVE_RADIUS:number = 40000;

const SPEED:number = 220;
const MIN_SPEED:number = 80;
const FAST_SPEED:number = 50;
const MIN_FAST_SPEED:number = 30;

const DRAIN_MAX:number = 0.001;
const DRAIN_MIN:number = 0.0006;
const BOT_DRAIN:number = 0.0003;
const DRAIN_MARGIN:number = 0.0004;

const DRAIN_LIMIT:number = 200;

enum STATE {
  ALIVE, DEAD
}

export interface actorStats {
  maxMass:number;
  foodEaten:number;
  playersKilled:number;
  botsKilled:number;
  stars:number;
  fartsFired:number;
  fartsTaken:number;
  deathBy:number;
  outTime:number;
  runTime:number;
  massLostTime:number;
  massLostFart:number;
  massLostStar:number;
  massLostDrop:number;
  maxTop:number;
  maxMassKilled:number;
}

const radiusEasing:(n:number)=>number = Easing.outCirc();
const speedEasing:(n:number)=>number = Easing.inOutCubic();//Quad();
const fastSpeedEasing:(n:number)=>number = Easing.outQuad();
const crazySpeedEasing:(n:number)=>number = Easing.outCubic();

export class Actor{
  static pool:ObjPool<any> = new ObjPool(Actor);
  static STATE = STATE;
  static calculateRadius(mass:number){return mass > MAX_MASS_RELATIVE_RADIUS ? MAX_RADIUS : interpolate(MIN_RADIUS, MAX_RADIUS, MAX_MASS_RELATIVE_RADIUS, mass, radiusEasing);};

  private _state:STATE = STATE.ALIVE;
  private _minMass:number = 10;
  private _angle:number;
  private _vectorSpeed:Point = new Point();
  private _mass:number;
  private _force:number;
  private _fastSpeed:number = MIN_FAST_SPEED;
  private _name:string;
  private _fast:boolean = false;
  private _dropMassTime:number = 0;
  private _droppedMass:number = 0;
  private _fire:boolean = false;
  private _delayFire:number = 0;
  private _delaySlow:number = 0;
  private _boundDeathTime:number = 0;
  private _crazy:boolean = false;
  private _crazyTime:number = 0;
  private _crazyDelay:number = 0;
  private _slow:boolean = false;
  private _ia:boolean = false;
  private _radius:number = 0;

  statsData:actorStats = {
    maxMass: 0,
    foodEaten: 0,
    playersKilled: 0,
    botsKilled: 0,
    stars: 0,
    fartsFired: 0,
    fartsTaken: 0,
    deathBy: 0,
    outTime: 0,
    runTime: 0,
    massLostTime: 0,
    massLostFart: 0,
    massLostStar: 0,
    massLostDrop: 0,
    maxTop: 0,
    maxMassKilled: 0
  };

  position:Point = new Point();
  box:rbush.ItemInterface = {minX: 0, minY: 0, maxX: 0, maxY: 0, id:-1};
  id:number;
  conn:WebsocketConnection;
  skin:any[];

  findingByMedicine:number = -1;

  constructor(){}

  initialize(id:number, conn?:WebsocketConnection){
    this.id = id;
    this.conn = conn;
    this.mass = this._minMass;
    if(this.isBot){
      this._ia = true;
      this.skin = generateSkinConfig(Math.floor(Math.random()*3), Math.floor(Math.random()*2));
      this._name = getRandomBotName();
      this.force = 1 + Math.random() * 8;
      this.angle = Math.floor(Math.random()*360) * Math.PI/180;
    }else{
      this._name = this.conn.clientData.name;
      this.skin = this.conn.clientData.skin;
    }

    this.box["id"] = this.id;
  }

  reset(){
    this.id = -1;
    this.conn = null;
    this._ia = false;
    this._name = "";
    this._state = STATE.ALIVE;
    this._angle = 0;
    this._vectorSpeed.set(0);
    this._mass = 0;
    this._force = 0;
    this._fast = false;
    this._dropMassTime = 0;
    this._droppedMass = 0;
    this._fire = false;
    this._delayFire = 0;
    this._delaySlow = 0;
    this._boundDeathTime = 0;
    this._crazy = false;
    this._crazyTime = 0;
    this._slow = false;
    this.position.set(0);
    this.box.minX = 0;
    this.box.minY = 0;
    this.box.maxX = 0;
    this.box.maxY = 0;
    this.box["id"] = -1;
    this.findingByMedicine = -1;

    //clean stats data
    for(let k in this.statsData){
      if(this.statsData.hasOwnProperty(k)){
        this.statsData[k] = 0;
      }
    }
  }

  getStatsData():number[]{
    let data:any[] = arrayPool.alloc();
    data.push(
      this.statsData.maxMass, this.statsData.foodEaten,
      this.statsData.playersKilled, this.statsData.botsKilled,
      this.statsData.stars, this.statsData.fartsFired,
      this.statsData.fartsTaken, this.statsData.deathBy,
      this.statsData.outTime, this.statsData.runTime,
      this.statsData.massLostFart, this.statsData.massLostTime,
      this.statsData.massLostStar, this.statsData.massLostDrop,
      this.statsData.maxTop, this.statsData.maxMassKilled
    );

    return data;
  }

  onDropMass(x:number, y:number, mass:number){}
  onFire(actor:Actor, x1:number, y1:number, speed:number, angle:number, mass:number){}
  onBoundDeath(actor:Actor){};

  update(delta:number){
    this.position.x += this._vectorSpeed.x*delta;
    this.position.y += this._vectorSpeed.y*delta;

    if(this._delayFire)this._delayFire -= delta;
    if(this._fire){
      this.__fireMass(delta);
    }

    if(this.fast){
      this.__dropMass(delta);
      this.statsData.runTime += delta*1000;
    }

    if(this.slow){
      this._delaySlow += delta;
      if(this._delaySlow >= SLOW_TIME){
        this.slow = false;
        this._delaySlow = 0;
      }
    }

    if(this._crazy){
      this._crazyTime -= delta;
      if(this._crazyTime <= 0){
        this._crazy = false;
        this._crazyDelay = CRAZY_DELAY;
      }
    }else if(this._crazyDelay){
      this._crazyDelay -= delta;
    }

    //lose mass if the actor stop the movement
    if(this._mass > this._minMass){
      let drain:number = 0;

      if(this.isBot&&this._ia) { //bots
        drain = BOT_DRAIN * delta;
      }else if(this.isBot){ //Bots witouht IA (players disconnected)
        drain = (DRAIN_MAX*2)*delta;
      }else if(this.isPlayer&&this.mass > DRAIN_LIMIT){ //players connected

        const margin:number = linearInterpolator(0, DRAIN_MARGIN, MAX_MASS_RELATIVE_RADIUS, this.mass);

        if(this._force <= 0.1){
          drain = (DRAIN_MAX+margin)*delta;
        }else{
          drain = (DRAIN_MIN+margin)*delta;
        }

      }

      if(drain){
        const drainValue:number = this._mass*drain;
        this.mass = this._mass - drainValue;
        this.statsData.massLostTime += drainValue;
      }
    }

    //simple bot movement
    if(!this.isPlayer && this._ia && Math.random() < 0.02){
      this.angle = Math.floor(Math.random()*360) * Math.PI/180;
      if(Math.random() < 0.02){
        this.force = 1 + Math.random() * 8;
      }
    }

    //todo: remove, just for test purposes
    /*if(this.isPlayer&&this.mass<MAX_MASS_RELATIVE_RADIUS*2){
      //this.mass = this._mass + this._mass*0.1*delta;
    }

    if(this.isBot && this.mass < 10000 && Math.random()*0.005){
      this.mass = this._mass + this._mass*0.005*delta;
    }*/
  }

  getGeneratedFoodNum(medicine?:boolean):number{
    if(medicine){
      return Math.min(Math.ceil(Math.random()*15) + interpolate(5, 30, MAX_MASS_RELATIVE_RADIUS*0.5 + MAX_MASS_RELATIVE_RADIUS, this._mass, Easing.inQuart()), 45);
    }
    return Math.min(Math.ceil(Math.random()*3) + interpolate(3, 18, MAX_MASS_RELATIVE_RADIUS*0.5 + MAX_MASS_RELATIVE_RADIUS, this._mass, Easing.inQuad()),20);
  }

  updateBox(){
    this.box.minX = this.position.x - this.radius;
    this.box.minY = this.position.y - this.radius;
    this.box.maxX = this.position.x + this.radius;
    this.box.maxY = this.position.y + this.radius;
  }

  fixPosition(delta:number, xBound:number, yBound:number){
    if(this.isBot && this._ia){

      if(this.position.x < -xBound){
        this.position.x = -xBound;
      }else if(this.position.x > xBound){
        this.position.x = xBound;
      }

      if(this.position.y < -yBound){
        this.position.y = -yBound;
      }else if(this.position.y > xBound){
        this.position.y = yBound;
      }

    }else{

      if(this.position.x < -xBound || this.position.x > xBound || this.position.y < -yBound || this.position.y > xBound) {
        this.__outOfBounds(delta);
      }else if(this._boundDeathTime !== 0){
        this._boundDeathTime = 0;
      }

    }
  }

  canBeCrazy():boolean {
    return this._crazyDelay <= 0;
  }

  toArray():ACTOR_DATA{
    let arr:any[] = arrayPool.alloc();
    arr[0] = this.id;
    arr[1] = ENTITY_TYPE.ACTOR;
    arr[2] = this._name;
    arr[3] = Math.round(this.position.x);
    arr[4] = Math.round(this.position.y);
    arr[5] = Math.round(this.radius);
    arr[6] = Math.floor(this.mass);
    arr[7] = this.__getFlags();
    arr[8] = this._crazy ? Math.round(this._crazyTime*1000) : 0;
    arr[9] = this.skin;
    return arr as ACTOR_DATA;
  }

  private __getFlags():number{
    let flags:number = 0;
    if(this.slow)flags |= ACTOR_FLAG.SLOW;
    if(this.fast)flags |= ACTOR_FLAG.FAST;
    if(this.isOutOfBounds)flags |= ACTOR_FLAG.OUT;
    if(this.crazy)flags |= ACTOR_FLAG.CRAZY;
    return flags;
  }

  private __outOfBounds(delta:number){
    this.statsData.outTime += delta*1000;
    this._boundDeathTime += delta;
    if(this._boundDeathTime >= BOUND_DEATH_TIME){
      this.onBoundDeath(this);
    }
  }

  private __fireMass(delta:number){
    const mass:number = 10+this._mass*0.05;
    if(this._delayFire <= 0 && (this.mass-mass) > this._minMass){
      this._delayFire = FIRE_TIME;
      this.mass = this._mass - mass;
      this.onFire(this, this.position.x, this.position.y, this.speed+80, this._angle, mass*0.7);
      this.statsData.fartsFired += 1;
      this.statsData.massLostFart += mass;
    }

    this._fire = false;
  }

  private __dropMass(delta:number){
    this._dropMassTime += delta;
    if(this._mass > this._minMass){
      const droppedMass:number = (10+this._mass*0.0070)*delta;
      this._droppedMass += droppedMass;
      this.mass = this._mass - droppedMass;
      this.statsData.massLostDrop += droppedMass;
    }else{
      this.fast = false;
    }

    if(this._dropMassTime >= 0.4 && this._droppedMass){ //ms
      const cosX:number = Math.cos(this._angle);
      const sinY:number = Math.sin(this._angle);
      const massCreated:number = this._droppedMass*0.7;
      const speed:number = this.speed + (this.radius*1.1+Food.calculateRadius(massCreated))/delta;
      let x:number = (this.position.x - (speed*cosX)*delta);
      let y:number = (this.position.y - (speed*sinY)*delta);

      this.onDropMass(x,y, Math.round(massCreated));
      this._dropMassTime = 0;
      this._droppedMass = 0;
    }
  }

  private __checkVectorSpeed(){
    const cosX:number = Math.cos(this._angle);
    const sinY:number = Math.sin(this._angle);
    const speed:number = this.fast ? this.speed + this._fastSpeed : this.speed;

    this._vectorSpeed.set(
      speed * cosX,
      speed * sinY
    );
  }

  get isPlayer():boolean{return !!this.conn;};
  get isBot():boolean{return !this.isPlayer;};

  get radius():number {return this._radius;};

  get speed():number{
    let speed:number = this._mass >= MAX_MASS ? MIN_SPEED : interpolate(SPEED, MIN_SPEED, MAX_MASS, this._mass, speedEasing);

    if(this.fast){
      speed += this._fastSpeed;
    }else{
      speed *= this._force;
    }

    let boost:number = 1;
    if(this.crazy){
      boost += this._mass >= MAX_MASS ? 0.6 : interpolate(1.1, 0.6, MAX_MASS, this._mass, crazySpeedEasing);
    }
    return (this.slow ? speed*0.6 : speed)*boost;
  }

  get angle():number{return this._angle;};
  set angle(value:number){
    if(value !== this._angle){
      this._angle = value;
      this.__checkVectorSpeed();
    }
  }

  get mass():number{return this._mass;};
  set mass(value:number){
    if(value !== this._mass){
      if(value < this._minMass){
        value = this._minMass;
      }
      this._mass = value;
      this._radius = Actor.calculateRadius(this._mass);

      if(this._mass > this.statsData.maxMass){
        this.statsData.maxMass = this._mass;
      }
    }
  }

  get force():number{return this._mass;};
  set force(value:number){
    if(value !== this._force){
      if(value < 0)value = 0;

      this._force = value/10;
    }
  }

  get state():STATE {return this._state;};
  set state(value:STATE){
    if(value !== this._state){
      this._state = value;
    }
  }

  get fast():boolean {return this._fast;};
  set fast(value:boolean){
    if(value !== this._fast){
      if(this.mass > this._minMass){
        this._fast = value;
        this._fastSpeed = this._mass >= MAX_MASS ? FAST_SPEED : interpolate(FAST_SPEED, MIN_FAST_SPEED, MAX_MASS, this._mass, speedEasing);
      }else{
        this._fast = false;
      }
      this.__checkVectorSpeed();
    }
  }

  get crazy():boolean {return this._crazy;};
  set crazy(value:boolean){
    if(value !== this._crazy){
      this._crazy = value;
      if(value){
        this._crazyTime = CRAZY_TIME/1000;
        this.__checkVectorSpeed();
      }
    }
  }

  get slow():boolean {return this._slow;};
  set slow(value:boolean){
    if(value !== this._slow){
      this._slow = value;
      this.__checkVectorSpeed();
    }
  }

  set fire(value:boolean) {
    if(this._fire !== value){
      this._fire = value;
    }
  }

  get name():string{return this._name;};

  get isOutOfBounds():boolean {return !!this._boundDeathTime;};
}
