/**
 * Created by nazarigonzalez on 9/6/16.
 */
import {WebsocketConnection} from "./WebsocketConnection";
import {Actor} from "../Actor";
import {Food} from '../Food';
import LogicLoop from '../LogicLoop';
import FartShoot from "../FartShoot";
import CrazyPill from "../CrazyPill";
import {Medicine, MEDICINE_SEARCH_DISTANCE} from "../Medicine";
import * as rbush from 'rbush';
import {interpolate, Easing} from "../interpolator";
import {arrayPool, safeMarginMass, minActorScreenSize, maxActorScreenSize} from "../../common/utils";
import {
  UPDATE_CODE, ENTITY_TYPE, ACTOR_BINARY, FOOD_BINARY, FART_SHOOT_BINARY,
  POWER_UP_BINARY, MEDICINE_BINARY, DEATH_BY
} from "../../common/interfaces";
import {BINARY, BufferView} from "../../common/Binary";
import {NodeLiteralObjectPool} from "../../common/LiteralObjectPool";
import {stats} from '../Statistics';

const rad:number = 2*Math.PI;
const MASS_DRAINED_IN_CRAZY_MODE:number = 0.03;
const MEDICINE_SEARCH_TIME:number = 1.5;
const SEND_LEADERBOARD_TIME:number = 3;
const CRAZY_BOT_PERCENT:number = 0.03;
const CRAZY_PLAYER_PERCENT:number = 0.07;
const MEDICINE_NUM:number = 10;

let literalObjPool:NodeLiteralObjectPool<any> = new NodeLiteralObjectPool({}, 100);
literalObjPool.resetCallback = function(obj:any){
  for(let key in obj){
    if(obj.hasOwnProperty(key)){
      //obj[key] = null;
      delete obj[key];
    }
  }
};

export class GameCore {
  private _worldFPSCount = 0;
  private _entities:Entity[] = [null];
  private _rbush:rbush.rbush;
  private _rbushBoxes:rbush.ItemInterface[] = [];
  private _actors:Actor[] = [];
  private _foods:Food[] = [];
  private _fartShoots:FartShoot[] = [];
  private _crazyPills:CrazyPill[] = [];
  private _botsCount:number = 0;
  private _foodCount:number = 0;
  private _width:number = 8000;
  private _height:number = 8000;
  private _logicLoop:LogicLoop;
  private _time:number = 0;
  private _maxBots:number = 0;
  private _maxFood:number = 0;
  private _actorsToKill:Actor[] = [];
  private _foodsToKill:Food[] = [];
  private _fartShootsToKill:FartShoot[] = [];
  private _crazyPillsToKill:CrazyPill[] = [];
  private _medicine:Medicine[] = [];
  private _sendLeaderboardTime:number = 0;
  private _easingView:(n:number)=>number = Easing.outExpo();

  private _entitiesKilled:{[id:number]:number} = {};

  players:any[] = [];
  worldFPS:number = 20;

  constructor(private _playerLimit:number){
    this._rbush = new (rbush as rbush.rbush)();

    this._maxBots = Math.floor(this._playerLimit*0.6);
    this._maxFood = Math.floor(this._playerLimit + (this._width*0.07));

    for(let i:number = 0; i < this._maxBots; i++){
      this.__addBot();
    }

    for(let i:number = 0; i < this._maxFood; i++){
      this.__spawnFood();
    }

    this._logicLoop = new LogicLoop(30);
    this._logicLoop.onUpdate = this.__onGameUpdate;
  }

  addPlayer(player:WebsocketConnection){
    const id:number = this.__getUniqueEntityID();
    let actor:Actor = Actor.pool.alloc();
    actor.initialize(id, player);
    actor.onDropMass = this.__dropActorMass;
    actor.onFire = this.__fireActorMass;
    actor.onBoundDeath = this.__actorOutOfBounds;
    this.__setActorInSafePosition(actor);
    this._actors.push(actor);
    this.players.push(player);
    this.__addEntity(id, actor);

    player.actor = actor;
    //console.log('Added a player', id);

    //Start the logic when the players come in
    if(this.players.length === 1){
      this.start();
    }
  }

  stop(){
    stats.sysStop();
    this._logicLoop.stop();
    console.log((new Date()).toString(), 'Game Stopped');
  }

  start(){
    stats.sysStart();
    this._logicLoop.start();
    console.log((new Date()).toString(), 'Game Started');
  }

  removePlayer(player:WebsocketConnection){
    if(player.actor)player.actor.conn = null;
    const index:number = this.players.indexOf(player);
    if(index !== -1){
      this.players.splice(index, 1);
    }
  }

  getInitialDataFor(player:WebsocketConnection){
    return [this._width/100, player.actor.toArray()];
  }

  isPlayerIn(player:WebsocketConnection):boolean {
    const index:number = this.players.indexOf(player);
    return index !== -1;
  }

  private __medicineSearchTarget(delta:number){
    const size:number = this._width*(MEDICINE_SEARCH_DISTANCE/2)*2;

    for(let i:number = 0; i < MEDICINE_NUM; i++){
      if(!this._medicine[i])this.__spawnMedicine(i);

      if(this._medicine[i].state !== Medicine.STATE.ALIVE)continue;

      this._medicine[i].searchTime -= delta;
      if(this._medicine[i].searchTime > 0)continue;

      const medicine:Medicine = this._medicine[i];

      const xx1:number = medicine.position.x - size/2;
      const yy1:number = medicine.position.y - size/2;

      const rnd:number = Math.random();
      let target:Actor;
      for(let i:number = 0; i < this._actors.length; i++){ //use rbush?
        if(this._actors[i].state === Actor.STATE.DEAD)continue;
        if(this._actors[i].findingByMedicine !== -1 && medicine.target !== this._actors[i])continue;
        if(!this.__existsRectCollision(xx1, yy1, size, size, this._actors[i]))continue;
        if(!(this._actors[i].isPlayer || this._actors[i].isBot&&rnd < 0.15))continue;
        if(!medicine.isBestTarget(this._actors[i]))continue;

        if(!target){
          target = this._actors[i];
        }else{
          target = this._actors[i].mass > target.mass ? this._actors[i] : target;
        }
      }

      if(target && medicine.target !== target){
        medicine.setTarget(target);
        medicine.searchTime = MEDICINE_SEARCH_TIME*5;
      }else{
        medicine.searchTime = MEDICINE_SEARCH_TIME;
      }

    }
  }

  private __getActorsUpdateInfo(actor:Actor):any[]{
    const maxActorWidth:number = 600*2;
    const minPortWidth:number = 800+actor.radius;
    const actorSize:number = interpolate(minActorScreenSize, maxActorScreenSize, maxActorWidth, actor.radius*2, this._easingView);
    const portWidth:number = (minPortWidth/(maxActorScreenSize-minActorScreenSize))*actorSize;

    let collisions:rbush.ItemInterface[] = this._rbush.search({ //todo pool this
      minX: actor.position.x - portWidth,
      minY: actor.position.y - portWidth,
      maxX: actor.position.x + portWidth,
      maxY: actor.position.y + portWidth
    });

    let lastUpdate:any = actor.conn.lastUpdate;
    let update:any[] = arrayPool.alloc();
    update[0] = 0;

    let ids:any = literalObjPool.alloc();
    for(let i:number = 0; i < collisions.length; i++){
      if(this._entities[collisions[i]["id"]]){

        let actorArray:any[] = this._entities[collisions[i]["id"]].toArray();
        ids[actorArray[0]] = true;

        //exists at last update
        if(!lastUpdate[actorArray[0]]){
          //create
          this.__addCreateActorByteData(update, actorArray);
        }else{
          //update
          this.__addUpdateActorByteData(update, actorArray);
        }

        lastUpdate[actorArray[0]] = actorArray;
      }
    }

    for(let id in lastUpdate){
      if(lastUpdate.hasOwnProperty(id) && lastUpdate[id]){
        if(!ids[id]){
          //remove
          let _id:number = parseInt(id, 10);
          let assasin:number = -1;
          if(this._entitiesKilled[_id]||this._entitiesKilled[_id] === 0){
            assasin = this._entitiesKilled[_id];
          }

          update[0] += 6; //6 bytes
          update.push(
            BINARY.UInt8, ENTITY_TYPE.MISC,
            BINARY.UInt8, UPDATE_CODE.REMOVE,
            BINARY.UInt16, _id,
            BINARY.Int16, assasin
          );

          arrayPool.free(lastUpdate[id]);
          //lastUpdate[id] = null;
          delete lastUpdate[id];
        }
      }
    }

    literalObjPool.free(ids);
    return update;
  }

  private __addCreateActorByteData(update:any[], data:any[]){
    switch(data[1]) {
      case ENTITY_TYPE.ACTOR:
        const byteLength:number = 17+BufferView.stringBytes(data[2])+data[9].length;
        update.push(
          BINARY.UInt8, ENTITY_TYPE.ACTOR,
          BINARY.UInt8, UPDATE_CODE.CREATE,
          ACTOR_BINARY[0], data[0],
          ACTOR_BINARY[1], data[1],
          ACTOR_BINARY[2], data[2],
          ACTOR_BINARY[3], data[3],
          ACTOR_BINARY[4], data[4],
          ACTOR_BINARY[5], data[5],
          ACTOR_BINARY[6], data[6],
          ACTOR_BINARY[7], data[7],
          ACTOR_BINARY[8], data[8]
        );
        for(let i:number = 0; i < data[9].length; i++)update.push(BINARY.UInt8, data[9][i]);
        update[0] += byteLength+1;
        break;
      case ENTITY_TYPE.FOOD:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.FOOD,
          BINARY.UInt8, UPDATE_CODE.CREATE,
          FOOD_BINARY[0], data[0],
          FOOD_BINARY[1], data[1],
          FOOD_BINARY[2], data[2],
          FOOD_BINARY[3], data[3],
          FOOD_BINARY[4], data[4],
          FOOD_BINARY[5], data[5]
        );
        update[0] += 13;
        break;
      case ENTITY_TYPE.FART_SHOOT:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.FART_SHOOT,
          BINARY.UInt8, UPDATE_CODE.CREATE,
          FART_SHOOT_BINARY[0], data[0],
          FART_SHOOT_BINARY[1], data[1],
          FART_SHOOT_BINARY[2], data[2],
          FART_SHOOT_BINARY[3], data[3],
          FART_SHOOT_BINARY[4], data[4],
          FART_SHOOT_BINARY[5], data[5],
          FART_SHOOT_BINARY[6], data[6]
        );
        update[0] += 15;
        break;
      case ENTITY_TYPE.POWER_UP:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.POWER_UP,
          BINARY.UInt8, UPDATE_CODE.CREATE,
          POWER_UP_BINARY[0], data[0],
          POWER_UP_BINARY[1], data[1],
          POWER_UP_BINARY[2], data[2],
          POWER_UP_BINARY[3], data[3],
          POWER_UP_BINARY[4], data[4]
        );
        update[0] += 11;
        break;
      case ENTITY_TYPE.MEDICINE:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.MEDICINE,
          BINARY.UInt8, UPDATE_CODE.CREATE,
          MEDICINE_BINARY[0], data[0],
          MEDICINE_BINARY[1], data[1],
          MEDICINE_BINARY[2], data[2],
          MEDICINE_BINARY[3], data[3],
          MEDICINE_BINARY[4], data[4],
          MEDICINE_BINARY[5], data[5]
        );
        update[0] += 13;
        break;
    }
  }

  private __addUpdateActorByteData(update:any[], data:any[]){
    switch(data[1]){
      case ENTITY_TYPE.ACTOR:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.ACTOR,//byte-len
          BINARY.UInt8, UPDATE_CODE.UPDATE,
          ACTOR_BINARY[0], data[0],
          ACTOR_BINARY[3], data[3],
          ACTOR_BINARY[4], data[4],
          ACTOR_BINARY[5], data[5],
          ACTOR_BINARY[6], data[6],
          ACTOR_BINARY[7], data[7],
          ACTOR_BINARY[8], data[8]
        );
        update[0] += 17; //16 from actor +1 for length
        break;
      case ENTITY_TYPE.FART_SHOOT:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.FART_SHOOT, //byte-len
          BINARY.UInt8, UPDATE_CODE.UPDATE,
          FART_SHOOT_BINARY[0], data[0],
          FART_SHOOT_BINARY[3], data[3],
          FART_SHOOT_BINARY[4], data[4]
        );
        update[0] += 8;
        break;
      case ENTITY_TYPE.FOOD:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.FOOD, //byte-len
          BINARY.UInt8, UPDATE_CODE.UPDATE,
          FOOD_BINARY[0], data[0],
          FOOD_BINARY[3], data[3],
          FOOD_BINARY[4], data[4]
        );
        update[0] += 8;
        break;
      case ENTITY_TYPE.POWER_UP:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.POWER_UP, //byte-len
          BINARY.UInt8, UPDATE_CODE.UPDATE,
          POWER_UP_BINARY[0], data[0],
          POWER_UP_BINARY[2], data[2],
          POWER_UP_BINARY[3], data[3]
        );
        update[0] += 8;
        break;
      case ENTITY_TYPE.MEDICINE:
        update.push(
          BINARY.UInt8, ENTITY_TYPE.MEDICINE, //byte-len
          BINARY.UInt8, UPDATE_CODE.UPDATE,
          MEDICINE_BINARY[0], data[0],
          MEDICINE_BINARY[2], data[2],
          MEDICINE_BINARY[3], data[3],
          MEDICINE_BINARY[4], data[4]
        );
        update[0] += 10;
        break;
    }
  }

  private __addEntity(id, entity){
    this._entities[id] = entity;
  }

  private __removeEntitiy(id){
    this._entities[id] = null;
  }

  private __spawnMedicine(index:number = 0){
    const id:number = this.__getUniqueEntityID();

    let medicine:Medicine;
    if(!this._medicine[index]){
      medicine = Medicine.pool.alloc();
      this._medicine[index] = medicine;
    }else{
      medicine = this._medicine[index];
    }

    medicine.reset();

    //medicine.id = id;
    medicine.initialize(id, this._width);

    this.__addEntity(id, medicine);
    medicine.state = Medicine.STATE.ALIVE;
    this.__setMedicineInSafePosition(medicine);
  }

  private __spawnFood = (x?:number, y?:number, mass?:number):Food =>{
    const id:number = this.__getUniqueEntityID();
    let food:Food = Food.pool.alloc();
    food.initialize(id, mass);
    food.onExpireOut = this.__onFoodExpireOut;
    if(typeof x === "number" || typeof y === "number"){
      food.position.set(x,y);
    }else{
      this.__setFoodInSafePosition(food);
    }
    this._foods.push(food);
    this._foodCount++;
    this.__addEntity(id, food);
    return food;
  };

  private __addBot(){
    const id:number = this.__getUniqueEntityID();
    let actor:Actor = Actor.pool.alloc();
    actor.initialize(id);
    actor.onDropMass = this.__dropActorMass;
    actor.onFire = this.__fireActorMass;
    this.__setActorInSafePosition(actor);
    this._actors.push(actor);
    this._botsCount++;
    this.__addEntity(id, actor);
  }

  private __setFoodInSafePosition(food:Food, percent?:number){
    let radiusPercent:number = percent || 0.98;

    if(!percent){
      const rnd:number = Math.random();

      if(rnd < 0.4){
        radiusPercent = 0.4;
      } else if(rnd < 0.6){
        radiusPercent = 0.6;
      }else if(rnd < 0.8){
        radiusPercent = 0.8;
      }
    }

    const _ww:number = this._width*radiusPercent;
    const _hh:number = this._height*radiusPercent;
    const ww:number = _ww/2 * radiusPercent;
    const hh:number = _hh/2 * radiusPercent;
    const radius:number = food.radius;

    food.position.set(
      -ww + radius + Math.floor(Math.random() * (_ww - radius)),
      -hh + radius + Math.floor(Math.random() * (_hh - radius))
    );

    let collide:boolean = false;
    for(let i = 0; i < this._foods.length; i++){
      if(this.__existsCollisionBetween(this._foods[i], food, 130)){
        collide = true;
        break;
      }
    }

    if(!collide){
      for(let i = 0; i < this._actors.length; i++){
        if(this.__existsCollisionBetween(this._actors[i], food, 130)){
          collide = true;
          break;
        }
      }
    }

    if(collide){
      return this.__setFoodInSafePosition(food);
    }
  }

  private __setActorInSafePosition(actor:Actor){
    const _gameWW:number = this._width*0.75;
    const _gameHH:number = this._height*0.75;
    const ww:number = _gameWW/2;
    const hh:number = _gameHH/2;
    const radius:number = actor.radius;

    actor.position.set(
      -ww + radius + Math.floor(Math.random() * (_gameWW - radius)),
      -hh + radius + Math.floor(Math.random() * (_gameHH - radius))
    );

    let collide:boolean = false;
    for(let i = 0; i < this._actors.length; i++){
      if(this.__existsCollisionBetween(this._actors[i], actor, 200)){
        collide = true;
        break;
      }
    }

    if(collide){
      return this.__setActorInSafePosition(actor);
    }
  }

  private __setMedicineInSafePosition(medicine:Medicine){
    const ww:number = this._width/2;
    const hh:number = this._height/2;
    const radius:number = medicine.radius;

    medicine.position.set(
      -ww + radius + Math.floor(Math.random() * (this._width - radius)),
      -hh + radius + Math.floor(Math.random() * (this._height - radius))
    );

    let collide:boolean = false;
    for(let i = 0; i < this._actors.length; i++){
      if(this.__existsCollisionBetween(this._actors[i], medicine, 300)){
        collide = true;
        break;
      }
    }

    if(collide){
      return this.__setMedicineInSafePosition(medicine);
    }
  }

  private __existsCollisionBetween(actor1:Entity, actor2:Entity, radiusPercent:number = 100):boolean {
    const margin:number = radiusPercent/100;
    const xx:number = (actor1.position.x - actor2.position.x);
    const yy:number = (actor1.position.y - actor2.position.y);
    const distance:number = Math.sqrt(xx*xx + yy*yy);
    let radius1:number, radius2:number;
    if(actor1.radius <= actor2.radius){
      radius1 = actor1.radius*margin;
      radius2 = actor2.radius;
    }else{
      radius1 = actor2.radius*margin;
      radius2 = actor1.radius;
    }
    return distance < radius1+radius2;
  }

  private __existsRectCollision(x:number, y:number, width:number, height:number, entity:Entity):boolean {
    if(x+width < entity.position.x)return false;
    if(x > entity.position.x+entity.radius)return false;
    if(y+height < entity.position.y)return false;
    if(y > entity.position.y+entity.radius)return false;
    return true;
  }

  private __getUniqueEntityID():number{
    const index:number = this._entities.indexOf(null);
    const id:number = (index !== -1 ? index : this._entities.length);
    return id;
  }

  private __killActor(actor){
    this._actorsToKill.push(actor);
    actor.state = Actor.STATE.DEAD;

    if(actor.isBot){
      this._botsCount--;
      if(this._actors.length < this._maxBots){
        this.__addBot();
      }
    }else{
      //todo: send info to the client
      actor.conn.kill();
    }
  }

  private __onFoodExpireOut = (food:Food)=>{
    this._foodsToKill.push(food);
    food.state = Food.STATE.DEAD;
    this._foodCount--;
  };

  private __dropActorMass = (x:number, y:number, mass:number)=>{
    this.__spawnFood(x,y,mass);
  };

  private __fireActorMass = (actor:Actor, x1:number, y1:number, speed:number, angle:number, mass:number)=>{
    const id:number = this.__getUniqueEntityID();
    let fart:FartShoot = FartShoot.pool.alloc();
    fart.initialize(id, mass);
    fart.onExpire = this.__expiredFire;
    fart.setDestintation(actor, x1, y1, speed, angle);
    this._fartShoots.push(fart);
    this.__addEntity(id, fart);
  };

  private __actorOutOfBounds = (actor:Actor)=>{
    actor.statsData.deathBy = DEATH_BY.OUT;
    this._actorsToKill.push(actor);
    actor.state = Actor.STATE.DEAD;
    if(actor.isPlayer){
      actor.conn.kill();
    }
  };

  private __onGameUpdate = (delta:number, deltaMS:number)=>{
    const now:number = Date.now();
    this._time += delta;

    const xx:number = this._width/2;
    const yy:number = this._height/2;

    this._rbushBoxes.length = 0;
    this._rbush.clear();

    for(let i:number = 0; i < this.players.length; i++){
      this.players[i].time += delta;
    }

    //update
    let len:number = this._actors.length;
    for(let i:number = 0; i < len; i++){
      this._actors[i].update(delta);
      this._actors[i].fixPosition(delta, xx,yy);
      this._actors[i].updateBox();
      this._rbushBoxes.push(this._actors[i].box);
    }

    for(let i:number = 0; i < this._fartShoots.length; i++){
      this._fartShoots[i].update(delta);
      this._fartShoots[i].updateBox();
      this._rbushBoxes.push(this._fartShoots[i].box);
    }

    for(let i:number = 0; i < this._crazyPills.length; i++){
      this._crazyPills[i].update(delta);
      this._crazyPills[i].fixPosition(delta, xx,yy);
      this._crazyPills[i].updateBox();
      this._rbushBoxes.push(this._crazyPills[i].box);
    }

    for(let i:number = 0; i < this._foods.length; i++){
      this._foods[i].update(delta);
      this._foods[i].fixPosition(delta, xx, yy);
      this._foods[i].updateBox();
      this._rbushBoxes.push(this._foods[i].box);
    }

    for(let i:number = 0; i < this._medicine.length; i++){
      if(!this._medicine[i])this.__spawnMedicine(i);
      this._medicine[i].update(delta);

      if(this._medicine[i].state !== Medicine.STATE.ALIVE){
        if(this._medicine[i].timeToRespawn <= 0)this.__spawnMedicine(i);
        continue;
      }

      this._medicine[i].fixPosition(delta, xx, yy);
      this._medicine[i].updateBox();
      this._rbushBoxes.push(this._medicine[i].box);
    }

    //bulk rbush
    this._rbush.load(this._rbushBoxes);

    //checkCollision
    for(let i:number = 0; i < len; i++){
      let actor1:Actor = this._actors[i];

      if(actor1.state !== Actor.STATE.ALIVE)continue;

      let collisions:rbush.ItemInterface[] = this._rbush.search(actor1.box);
      for(let n:number = 0; n < collisions.length; n++){

        if(collisions[n]["id"] === actor1.id) continue;

        if(this._entities[collisions[n]["id"]] instanceof Actor){

          const entity:Actor = this._entities[collisions[n]["id"]] as Actor;

          if(entity.state !== Actor.STATE.ALIVE)continue;
          if(actor1.crazy&&entity.crazy)continue;
          const accuracy:number = (actor1.crazy&&actor1.mass<entity.mass||entity.crazy&&entity.mass<actor1.mass) ? 50 : -30;
          if(!this.__existsCollisionBetween(actor1, entity, accuracy))continue;

          //exists collision
          if(actor1.crazy && actor1.mass < entity.mass){
            this.__actorDrainMass(actor1, entity, delta);
          }else if(entity.crazy && entity.mass < actor1.mass){
            this.__actorDrainMass(entity, actor1, delta);
          }else{
            const diff:number = actor1.mass - entity.mass;
            const killed:Actor = actor1.mass > entity.mass ? entity : actor1;
            const assasin:Actor = actor1.mass > entity.mass ? actor1 : entity;
            const safeMargin:number = safeMarginMass(assasin.mass);
            if(diff < -safeMargin || diff > safeMargin){
              this.__killActorBy(killed, assasin);
            }
          }

        }else if(this._entities[collisions[n]["id"]] instanceof FartShoot){

          const entity:FartShoot = this._entities[collisions[n]["id"]] as FartShoot;
          if(entity.state !== Food.STATE.ALIVE)continue;
          if(entity.isSafeFor(actor1))continue;

          if(!this.__existsCollisionBetween(actor1, entity, 50))continue;

          //exists collision
          this.__actorHitFartShoot(actor1, entity);

        }else if(this._entities[collisions[n]["id"]] instanceof Food){

          const entity:Food = this._entities[collisions[n]["id"]] as Food;

          if(entity.state !== Food.STATE.ALIVE)continue;
          if(!this.__existsCollisionBetween(actor1, entity, 130))continue;

          //exists collision
          this.__actorEatFood(actor1, entity);

        }else if(this._entities[collisions[n]["id"]] instanceof CrazyPill){

          const entity:CrazyPill = this._entities[collisions[n]["id"]] as CrazyPill;

          if(entity.state !== CrazyPill.STATE.ALIVE)continue;
          if(actor1.crazy)continue;
          if(!actor1.canBeCrazy())continue;
          if(!this.__existsCollisionBetween(actor1, entity, 80))continue;

          //exists collision
          this.__actorEatCrazyPill(actor1, entity);

        }else if(this._entities[collisions[n]["id"]] instanceof Medicine){

          const entity:Medicine = this._entities[collisions[n]["id"]] as Medicine;

          if(entity.state !== Medicine.STATE.ALIVE)continue;
          if(actor1.crazy)continue;
          if(!this.__existsCollisionBetween(actor1, entity, -50))continue;

          this.__actorEatMedicine(actor1, entity);
        }

      }

    }

    this.__medicineSearchTarget(delta);

    //Send world update
    this._worldFPSCount += delta;
    if(this._worldFPSCount >= 1/this.worldFPS){
      process.nextTick(this.__sendWorldUpdate); //async update, dont block the update logic function
      this._worldFPSCount = 0;
    }

    this._sendLeaderboardTime += delta;
    if(this._sendLeaderboardTime >= SEND_LEADERBOARD_TIME){
      process.nextTick(this.__sendLeaderboard);
      this._sendLeaderboardTime = 0;
    }

    this.__cleanWorld();

    //Stop the logic if no one player are in
    if(this.players.length <= 0){
      this.stop();
    }

    stats.systemData.time = this._time;
    stats.systemData.loopTime.push(Date.now()-now);
    stats.systemData.mapSize = this._width;
    stats.systemData.foods.push(this._foods.length);
    stats.systemData.actors.push(this._actors.length);
    stats.systemData.players.push(this.players.length);
  };

  private __actorDrainMass(vampire:Actor, victim:Actor, delta:number){
    if(victim.mass > 0){
      const drainedMass:number = Math.ceil(victim.mass*MASS_DRAINED_IN_CRAZY_MODE * delta);
      victim.mass -= drainedMass;
      vampire.mass += drainedMass;
      if(victim.mass < 0)victim.mass = 0;
      victim.statsData.massLostStar += drainedMass;
    }
  }

  private __killActorBy(killed:Actor, assasin:Actor){
    this._entitiesKilled[killed.id] = assasin.id;

    killed.statsData.deathBy = DEATH_BY.PLAYER;
    if(killed.isPlayer){
      assasin.statsData.playersKilled += 1;
    }else{
      assasin.statsData.botsKilled += 1;
    }

    if(killed.mass > assasin.statsData.maxMassKilled){
      assasin.statsData.maxMassKilled = killed.mass;
    }

    const angle:number = Math.atan2(killed.position.y - assasin.position.y, killed.position.x - assasin.position.x);
    const totalMass:number = (0.25 + Math.random() * 0.15)*killed.mass;
    const n:number = killed.getGeneratedFoodNum();
    const mass:number = Math.max(Math.ceil(totalMass/n),2);
    const cosX:number = Math.cos(angle);
    const sinY:number = Math.sin(angle);
    const speedRadius:number = assasin.radius*0.9;
    const xx:number = assasin.position.x + speedRadius*cosX;
    const yy:number = assasin.position.y + speedRadius*sinY;
    for(let i:number = 0; i < n; i++){
      let food:Food = this.__spawnFood(xx, yy, mass);
      food.setMovement(angle, 200 + Math.random()*600);
    }

    //generate crazy pill
    if((killed.isBot&&Math.random() < CRAZY_BOT_PERCENT) || (killed.isPlayer&&Math.random() < CRAZY_PLAYER_PERCENT)){
      const crazyPill:CrazyPill = CrazyPill.pool.alloc();
      crazyPill.initialize(this.__getUniqueEntityID(), angle, 550);
      crazyPill.position.copy(killed.position);
      this._crazyPills.push(crazyPill);
      this.__addEntity(crazyPill.id, crazyPill);
    }
    this.__killActor(killed);
  }

  private __actorEatMedicine(actor:Actor, medicine:Medicine){
    this._entitiesKilled[medicine.id] = actor.id;
    medicine.die();

    const totalMass:number = (0.35 + Math.random() * 0.20)*actor.mass;
    const n:number = actor.getGeneratedFoodNum(true);
    const mass:number = Math.max(Math.ceil(totalMass/n),2);
    for(let i:number = 0; i < n; i++){
      let food:Food = this.__spawnFood(actor.position.x, actor.position.y, mass);
      food.setMovement(Math.random()*rad, 160 + Math.random()*460);
    }

    actor.statsData.deathBy = DEATH_BY.MEDICINE;
    this.__killActor(actor);
    this.__removeEntitiy(medicine.id);
    //Medicine.pool.free(medicine);
    //this._medicine = null;
    //todo: Add a array with medicines
    //this._medicineSearchTargetTime = MEDICINE_SEARCH_TIME*MEDICINE_TIMES_TO_RESPAWN;
  }

  private __actorEatFood(actor:Actor, food:Food){
    this._entitiesKilled[food.id] = actor.id;
    actor.statsData.foodEaten += 1;

    const multi:number = actor.isBot ? 2 : 1;

    actor.mass += food.mass*multi;
    this._foodsToKill.push(food);
    food.state = Food.STATE.DEAD;

    this._foodCount--;
    if(this._foods.length < this._maxFood){
      //this.__spawnFood();
      process.nextTick(this.__spawnFood)
    }
  }

  private __actorEatCrazyPill(actor:Actor, pill:CrazyPill){
    this._entitiesKilled[pill.id] = actor.id;
    actor.statsData.stars += 1;

    actor.crazy = true;
    actor.mass += 10 + Math.round(actor.mass*0.02);
    this._crazyPillsToKill.push(pill);
    pill.state = CrazyPill.STATE.DEAD;
  }

  private __actorHitFartShoot(actor:Actor, fart:FartShoot){
    this._entitiesKilled[fart.id] = actor.id;
    actor.statsData.fartsTaken += 1;

    actor.mass += fart.mass;
    this._fartShootsToKill.push(fart);
    fart.state = FartShoot.STATE.DEAD;
    actor.slow = true;
  }

  private __cleanWorld(){
    //todo, move to process nexttick?
    if(this._actorsToKill.length){
      for(let i:number = 0; i < this._actorsToKill.length; i++){
        const index:number = this._actors.indexOf(this._actorsToKill[i]);
        if(index !== -1){
          this._actors.splice(index, 1);
          this.__removeEntitiy(this._actorsToKill[i].id);
          if(this._actorsToKill[i].isBot){
            Actor.pool.free(this._actorsToKill[i]);
          }
        }
      }

      this._actorsToKill.length = 0;
    }

    if(this._foodsToKill.length){
      for(let i:number = 0; i < this._foodsToKill.length; i++){
        const index:number = this._foods.indexOf(this._foodsToKill[i]);
        if(index !== -1){
          this._foods.splice(index, 1);
          this.__removeEntitiy(this._foodsToKill[i].id);
          Food.pool.free(this._foodsToKill[i]);
        }
      }

      this._foodsToKill.length = 0;
    }

    if(this._fartShootsToKill.length){
      for(let i:number = 0; i < this._fartShootsToKill.length; i++){
        const index:number = this._fartShoots.indexOf(this._fartShootsToKill[i]);
        if(index !== -1){
          this._fartShoots.splice(index, 1);
          this.__removeEntitiy(this._fartShootsToKill[i].id);
          FartShoot.pool.free(this._fartShootsToKill[i]);
        }
      }

      this._fartShootsToKill.length = 0;
    }

    if(this._crazyPillsToKill.length){
      for(let i:number = 0; i < this._crazyPillsToKill.length; i++){
        const index:number = this._crazyPills.indexOf(this._crazyPillsToKill[i]);
        if(index !== -1){
          this._crazyPills.splice(index, 1);
          this.__removeEntitiy(this._crazyPillsToKill[i].id);
          CrazyPill.pool.free(this._crazyPillsToKill[i]);
        }
      }

      this._crazyPillsToKill.length = 0;
    }
  }

  private __expiredFire = (fart:FartShoot)=>{
    this._fartShootsToKill.push(fart);
    fart.state = FartShoot.STATE.DEAD;
  };

  private __sortActors = (a:Actor, b:Actor)=>{
    return b.mass - a.mass;
  };

  private __sendWorldUpdate = ()=>{
    const now:number = Date.now();
    const len:number = this.players.length;
    for(let i:number = 0; i < len; i++) {
      if(this.players[i] && this.players[i].actor){
        //Need to check the connection before send, maybe the players was kicked by lag or something
        this.players[i].sendUpdate(this.__getActorsUpdateInfo(this.players[i].actor));
      }
    }

    this._entitiesKilled = {}; //todo pool this
    stats.systemData.time = this._time;
    stats.systemData.worldUpdateTime.push(Date.now()-now);
  };

  private __sendLeaderboard = ()=>{
    //console.time('leader');
    this._actors.sort(this.__sortActors);

    const len:number = this.players.length;
    for(let i:number = 0; i < len; i++) {
      if(this.players[i] && this.players[i].actor){
        this.players[i].sendLeaderboard(this._actors);
      }
    }
    //console.timeEnd('leader');
  };
}

export type Entity = Actor | Food | FartShoot | CrazyPill | Medicine;
