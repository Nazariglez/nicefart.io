import config from '../config';
import Game from "../Game";
import DisplayActor from '../actors/DisplayActor';
import MiniMap from "../actors/MiniMap";
import DisplayFartShoot from "../actors/DisplayFartShoot";
import {ENTITY_TYPE} from "../../common/interfaces";
import {DisplayPowerUp} from "../actors/DisplayPowerUp";
import DisplayFood from "../actors/DisplayFood";
import AbstractScene from "./AbstractScene";
import DisplayMedicine from "../actors/DisplayMedicine";
import {
  distanceBetween, angleBetween, linearInterpolator,
  arrayPool, safeMarginMass,
  minActorScreenSize, maxActorScreenSize
} from "../../common/utils";
import {ActorHelper, ActorCreateConfig, ActorUpdateConfig} from "../helpers/ActorHelper";
import {FoodCreateConfig, FoodHelper} from "../helpers/FoodHelper";
import {FartShootCreateConfig, FartShootHelper} from "../helpers/FartShootHelper";
import {MedicineCreateConfig, MedicineHelper} from "../helpers/MedicineHelper";
import {PowerUpCreateConfig, PowerUpHelper} from "../helpers/PowerUpHelper";
import ScoreUI from "../actors/ScoreUI";
import Leaderboard from "../actors/Leaderboard";
import ScoreText from "../actors/ScoreText";
import DisplayTransition from "../actors/DisplayTransition";
import DisplayOutArrow from "../actors/DisplayOutArrow";
import {vibrate, isDesktop, isMobile, isApp} from "../helpers/device";
import CircleButton from "../actors/CircleButton";
import FastButton from "../actors/FastButton";
import FartButton from "../actors/FartButton";
import PepperButton from "../actors/PepperButton";
import CrazyBar from "../actors/CrazyBar";

const MASS_CHECK_TIMER:number = 0.5;

let tmpPoint:PIXI.Point = new PIXI.Point();
let tmpPoint2:PIXI.Point = new PIXI.Point();
const rad90:number = 90*PIXI.DEG_TO_RAD;

export default class GameScene extends AbstractScene{
  private _initialized:boolean = false;
  private _actorId:number;
  private _myActor:DisplayActor;
  private _inputTime:number = 0;
  private _inputPoint:PIXI.Point = new PIXI.Point();
  private _miniMap:MiniMap;
  private _scoreUI:ScoreUI;
  private _leaderboard:Leaderboard;
  private _fast:boolean = false;
  private _fireKey:boolean = false;
  private _firePepper:boolean = false;
  private _particleContainer:PIXI.ParticleContainer;
  private _cameraOffset:number = 10;
  private _cameraPosition:PIXI.Point = new PIXI.Point();
  private _shakeTime:number = 0;
  private _shakeForce:number = 0;
  private _entities:{[id:number]:any} = {};
  private _transition:DisplayTransition;
  private _outArrow:DisplayOutArrow;

  private _grayFilter:PIXI.filters.GrayFilter = new PIXI.filters.GrayFilter();
  private _pixelateFilter:PIXI.filters.PixelateFilter = new PIXI.filters.PixelateFilter();
  private _sepiaFilter:PIXI.filters.SepiaFilter = new PIXI.filters.SepiaFilter();
  private _rgbSplitFilter:PIXI.filters.RGBSplitFilter = new PIXI.filters.RGBSplitFilter();
  private _blurFilter:PIXI.filters.BlurFilter = new PIXI.filters.BlurFilter();
  private _colorStepFilter:PIXI.filters.ColorStepFilter = new PIXI.filters.ColorStepFilter();
  private _shockWaveFilter:PIXI.filters.ShockwaveFilter = new PIXI.filters.ShockwaveFilter();
  private _grayTween:PIXI.tween.Tween;
  private _pixelateTween:PIXI.tween.Tween;
  private _sepiaTween:PIXI.tween.Tween;
  private _rgbTween:PIXI.tween.Tween;
  private _blurTween:PIXI.tween.Tween;
  private _colorStepTween:PIXI.tween.Tween;
  private _waveTween:PIXI.tween.Tween;
  private _closeFilters:any[] = [];

  private _fixedCamFactor:number = -1;
  private _lastMass:number = -1;
  private _lastMassTimer:number = 0;
  private _topPosition:number = Number.MAX_VALUE;

  private _buttonFast:FastButton;
  private _buttonFart:FartButton;
  private _buttonPepper:PepperButton;
  private _crazyBar:CrazyBar;

  background:PIXI.extras.TilingSprite;

  constructor(public game:Game){
    super(game);
    this.__init();
  }

  isMyActor(actor:DisplayActor):boolean{
    return this._myActor === actor;
  }

  sendNetworkInput(angle:number, force:number, fast:boolean = false, fire:boolean = false, pepper:boolean = false){}

  initialize(data:any){
    this.reset();
    this._actorId = data[1].id;

    this._myActor = this.__createDisplayActor(data[1]);
    this._entities[this._actorId] = this._myActor;
    this._myActor.on('crazy', this.__onActorCrazy);
    this._myActor.on('slow', this.__onActorSlow);
    this._cameraPosition.copy(this._myActor.position);

    if(!this.game.accel){

      this.interactive = true;
      this.on('mousedown', this.__onMouseDown);
      this.on('mouseup', this.__onMouseUp);
      this.on('mouseupoutside', this.__onMouseUp);
      this.on('mousemove', this.__onMouseMove);

    }

    this._miniMap.setUnit(data[0]);
    this.__fixUI();

    const camX:number = -this._myActor.position.x * this.world.scale.x;
    const camY:number = -this._myActor.position.y * this.world.scale.y;
    this.world.position.set(camX, camY);

    this._lastMass = this._myActor.mass;
    this._lastMassTimer = MASS_CHECK_TIMER;
  }

  onResizeWindow(){
    super.onResizeWindow();
    if(!this._initialized)return;
    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background.scale.set(max/this.background.width);
    this.background.tileScale.set((this._internalScale/this.background.scale.x)*2);

    this.__fixUI();
  }

  createEntity(data:any){
    if(data.id === this._actorId)return;

    let id:number = data.id;
    let entity:any;
    switch(data.type){
      case ENTITY_TYPE.ACTOR:
        entity = this.__createDisplayActor(data as ActorCreateConfig);
        break;
      case ENTITY_TYPE.FOOD:
        entity = this.__createDisplayFood(data as FoodCreateConfig);
        break;
      case ENTITY_TYPE.POWER_UP:
        entity = this.__createDisplayPowerUp(data as PowerUpCreateConfig);
        break;
      case ENTITY_TYPE.FART_SHOOT:
        entity = this.__createDisplayFartShoot(data as FartShootCreateConfig);
        break;
      case ENTITY_TYPE.MEDICINE:
        entity = this.__createDisplayMedicine(data as MedicineCreateConfig);
        break;
    }
    this._entities[id] = entity;
  }

  updateEntity(delta:number, data:ActorUpdateConfig){
    if(this._entities[data.id]){
      this._entities[data.id].addData(delta, data);
    }
  }

  removeEntity(id:number, assasin?:number){
    if(this._entities[id]){
      let radius:number = this._myActor ? this._myActor.radius : 100;
      if(assasin !== -1 && this._entities[assasin]){

        //Shake effect when i kill other player
        if(this._entities[id].entityType === ENTITY_TYPE.ACTOR){
          if(this._actorId === assasin){
            this.__shake(200, 3 + Math.ceil(radius/100));
          }else if(id === this._actorId){
            this._fixedCamFactor = this._myActor.width;
            this._crazyBar.visible = false;
          }
        }else if(this._entities[id].entityType === ENTITY_TYPE.MEDICINE){
          this.__waveEffect(this._entities[assasin].position.x, this._entities[assasin].position.y);
          if(this._actorId !== id)this.__shake(300, 7 + Math.ceil(radius/100));
        }else if(this._entities[id].entityType === ENTITY_TYPE.FOOD || this._entities[id].entityType === ENTITY_TYPE.FART_SHOOT){
          if(this._actorId === assasin){
            if(this._myActor.multi > 1){
              this.__score(`+ ${this._entities[id].mass*this._myActor.multi}`, 0x60ff00);
            }else{
              this.__score(`+ ${this._entities[id].mass}`, 0x00fff0);
            }
          }
        }

        this._entities[id].hide(this._entities[assasin]);
      }else{
        this._entities[id].hide();
      }
      this._entities[id] = null;
    }
  }

  update(delta:number){
    super.update(delta);
    if(this._myActor){
      const factor:number = this._fixedCamFactor !== -1 ? this._fixedCamFactor : this._myActor.width;
      let size:number = linearInterpolator(minActorScreenSize, maxActorScreenSize, 600*2, factor);
      const ratio:number = size/factor;

      this.world.scale.set(ratio*this._internalScale);

      this._cameraOffset = linearInterpolator(0.5, 11, 1200, factor);
      this.__checkCameraOffset();

      let offsetX:number = 0;
      let offsetY:number = 0;
      if(this._shakeTime > 0){
        this._shakeTime -= delta;
        const force2:number = this._shakeForce*2;
        offsetX = -this._shakeForce + Math.random()*force2;
        offsetY = -this._shakeForce + Math.random()*force2;
      }

      const camX:number = -(this._cameraPosition.x+offsetX) * this.world.scale.x;
      const camY:number = -(this._cameraPosition.y+offsetY) * this.world.scale.y;
      this.world.position.set(camX, camY);

      this.__fixBackgroundPosition();

      //Works only if the actors still alive
      if(this._fixedCamFactor === -1){
        this._inputTime += delta;
        if(this._inputTime >= 1/10){
          this.__sendInput();
        }

        if(this._crazyBar.visible){
          this._crazyBar.setProgress(this._myActor.crazyTime);
        }

        this._miniMap.drawActor(this._myActor);
        this._scoreUI.size = this._myActor.mass;
        this._buttonPepper.setPeppers(this._myActor.peppers);
        this._buttonFast.setPercent(this._myActor.fastPercent, this._myActor.fastPenalty);

        this.__checkNearActors();

        this._lastMassTimer -= delta;
        if(this._lastMassTimer <= 0){
          const diff:number = this._lastMass - this._myActor.mass;
          if(diff > 0){
            this.__score(`- ${diff}`, 0xff8f08);
          }
          this._lastMassTimer = MASS_CHECK_TIMER;
          this._lastMass = this._myActor.mass;
        }

        if(this._myActor.out){
          const angle:number = Math.atan2(this._myActor.position.y, this._myActor.position.x);
          const cosX:number = Math.cos(angle);
          const sinY:number = Math.sin(angle);
          const pos:number = -(config.game.size/2)*0.8;

          const angle2:number = Math.atan2(this._myActor.position.x, this._myActor.position.y);
          this._outArrow.rotation = -(angle2+rad90);
          this._outArrow.position.set(
            pos*cosX,
            pos*sinY
          );

        }

        if(this.game.accel){ //landscape
          this._inputPoint.x = this.game.accel.y * 500;
          this._inputPoint.y = this.game.accel.x * 500;

          if(Math.abs(this._inputPoint.x) < 40)this._inputPoint.x = 0;
          if(Math.abs(this._inputPoint.y) < 40)this._inputPoint.y = 0;
        }

      }

    }
  }

  runFast(value:boolean){
    if(value){
      this.__onMouseDown(null);
    }else{
      this.__onMouseUp(null);
    }
  }

  fire(){
    this._fireKey = true;
    this.__sendInput();
  }

  pepper(){
    //todo, send input with a dirty flag?
    this._firePepper = true;
    this.__sendInput();
  }

  sortActors(){
    this.world.children.sort((a:DisplayActor, b:DisplayActor)=>{
      if(a.crazy && b.crazy)return 0;
      if(a.crazy /*|| (a as any).topIndex*/)return 1;
      if(b.crazy)return -1;

      return a.mass - b.mass;
    });
  }

  reset(){
    console.log('reset');
    this._leaderboard.reset();
    this.__sendActorsToTheirPool();
    this.world.children.length = 0;
    this._particleContainer.children.length = 0;
    this.world.addChild(this._particleContainer);
    this._topPosition = Number.MAX_VALUE;
    this._transition.visible = false;
    this._outArrow.hide();

    this._fixedCamFactor = -1;
    this._entities = {};
    this._actorId = -1;
    this._myActor = null;
    this.filters = null;
  }

  closeAnimation(time:number = 1000, cb?:()=>void){
    if(!config.game.effects)return;
    this.__shake(600, 15);
    this._grayFilter.gray = 0;
    this._pixelateFilter.size.x = 1;
    this._pixelateFilter.size.y = 1;

    this.filters = this._closeFilters;
    this._pixelateTween.reset();
    this._pixelateTween.to({
      size: {
        x: 10,
        y: 10
      }
    });
    this._pixelateTween.time = time;
    this._pixelateTween.start();

    this._grayTween.reset();
     this._grayTween.to({
       gray: 0.5
     });
     this._grayTween.time = time;
     this._grayTween.start();

    this._transition.visible = true;
    this._transition.open(time*0.7, cb);
  }

  outAnimation(state:boolean, actor:DisplayActor){
    if(!config.game.effects||this._myActor!==actor)return;
    if(state){
      this._sepiaFilter.sepia = 0;
      this._sepiaTween.reset();
      this._sepiaTween.to({sepia:1});
      this._sepiaTween.time = 600;
      this._sepiaTween.pingPong = true;
      this._sepiaTween.loop = true;
      this._sepiaTween.start();
      this.__applyFilter(this._sepiaFilter);
      this._outArrow.show();
    }else{
      this._sepiaTween.stop();
      this.__removeFilter(this._sepiaFilter);
      this._outArrow.hide();
    }
  }

  updateRadar(data:number[]){
    this._miniMap.setFoodPosition(data);
  }

  updateLeaderboard(data:any[]){
    let len:number = (data.length-1)/2;
    for(let i:number = 0; i < len; i++){
      let n:number = (i*2)+1;
      this._leaderboard.setTop(data[n], data[n+1]);
    }

    if(data[0] && data[0] <= 10 && data[0] !== this._topPosition){
      let text:ScoreText = ScoreText.pool.alloc();
      if(data[0] < this._topPosition){
        text.show(`TOP ${data[0]}`, 0x00ff00, 0.8, 50);
      }else if(data[0] > this._topPosition){
        text.show(`TOP ${data[0]}`, 0xff0000, 0.8, 50);
      }
      text.scale.set(1.3);
      this.ui.addChild(text);
    }

    this._topPosition = data[0];

    this._leaderboard.setMyPosition(data[0], this._myActor.name);
    arrayPool.free(data);
  }

  private __score(str:string, color:number = 0xffffff){
    let text:ScoreText = ScoreText.pool.alloc();
    text.show(str, color);
    this.ui.addChild(text);
  }

  private __waveEffect(x:number, y:number){
    if(!config.game.effects)return;
    tmpPoint.set(x,y);
    this.toLocal(tmpPoint, this.world, tmpPoint2);
    this._shockWaveFilter.center.x = (tmpPoint2.x+this.width/2)/this.width;
    this._shockWaveFilter.center.y = (tmpPoint2.y+this.height/2)/this.height;
    this.__applyFilter(this._shockWaveFilter);
    this._shockWaveFilter.time = 0;
    this._waveTween.reset();
    this._waveTween.time = 500;
    this._waveTween.easing = PIXI.tween.Easing.inExpo();
    this._waveTween.to({
      time: 1
    });
    this._waveTween.once('end', ()=>{
      this.__removeFilter(this._shockWaveFilter);
    });
    this._waveTween.start();
  }

  private __fixUI(){
    this._miniMap.position.set(
      (this._renderer.width/2)/this.ui.scale.x - this._miniMap.width/2 - 5,
      (this._renderer.height/2)/this.ui.scale.y - this._miniMap.height/2 - 5
    );

    this._scoreUI.position.set(
      -(this._renderer.width/2)/this.ui.scale.x + this._scoreUI.width/2 + 5,
      (this._renderer.height/2)/this.ui.scale.y - this._scoreUI.height/2 - 4
    );

    this._leaderboard.position.set(
      (this._renderer.width/2)/this.ui.scale.x - this._leaderboard.width/2 - 5,
      -(this._renderer.height/2)/this.ui.scale.y + this._leaderboard.height/2 + 5
    );

    this._crazyBar.position.set(
      0,
      -(this._renderer.height/2)/this.ui.scale.y + 50
    );

    if(isDesktop){
      //desktop position for Action buttons
      this._buttonFast.position.set(
        -100 - this._buttonFast.width/2,
        (this._renderer.height/2)/this.ui.scale.y - (this._buttonFast.height/2 + 5)
      );

      this._buttonFart.position.set(
        0,
        (this._renderer.height/2)/this.ui.scale.y - (this._buttonFart.height/2 + 5)
      );

      this._buttonPepper.position.set(
        100 + this._buttonFast.width/2,
        (this._renderer.height/2)/this.ui.scale.y - (this._buttonPepper.height/2 + 5)
      );
    }else{
      //mobile position for actions buttons
      this._buttonFart.position.set(
        -(this._renderer.width/2)/this.ui.scale.x + (this._buttonFast.width/2 + 8),
        -100 + this._buttonFast.height/2
      );

      this._buttonPepper.position.set(
        -(this._renderer.width/2)/this.ui.scale.x + (this._buttonFart.width/2 + 8),
        100 - this._buttonFast.height/2
      );

      this._buttonFast.position.set(
        (this._renderer.width/2)/this.ui.scale.x - (this._buttonFart.width/2 + 8),
        100 - this._buttonFast.height/2
      );
    }
  }

  private __checkNearActors(){
    const len:number = this.world.children.length;
    for(let i:number = 0; i < len; i++){
      if(this.world.children[i] === this._myActor)continue;
      if((this.world.children[i] as DisplayActor).entityType !== ENTITY_TYPE.ACTOR)continue;
      const actor:DisplayActor = this.world.children[i] as DisplayActor;

      actor.displayName(actor.width > this._myActor.width*0.1);

      if(
        this._myActor.mass > actor.mass
        && !actor.crazy
        && this._myActor.isNearTo(actor)
        && (Math.abs(actor.mass - this._myActor.mass) > safeMarginMass(this._myActor.mass))
      ){
        actor.displayAura(true);
      }else{
        actor.displayAura(false);
      }
    }
  }

  private __fixBackgroundPosition(){
    const scale:number = this.world.scale.x;
    const relativeScale:number = scale/this.background.scale.x;
    const bgSize:number = this.background.width*relativeScale;
    const offset:number = (bgSize-this.background.width)/2;
    this.background.tileScale.set(relativeScale*2);

    this.background.tilePosition.x = -this._cameraPosition.x*relativeScale - offset;
    this.background.tilePosition.y = -this._cameraPosition.y*relativeScale - offset;
  }

  private __applyFilter(...args:any[]){
    if(!config.game.effects)return;
    if(!this.filters){
      this.filters = args.map((f)=>f);
      return;
    }

    let filters:any[] = [];
    args.forEach((filter:any)=>{
      const index:number = this.filters.indexOf(filter);
      if(index === -1)filters.push(filter);
    });

    this.filters = this.filters.concat(filters);
  }

  private __removeFilter(...args:any[]){
    if(!config.game.effects)return;
    if(!this.filters||!this.filters.length)return;
    this.filters = this.filters.filter((f)=>args.indexOf(f) === -1);
    if(!this.filters.length)this.filters = null;
  }

  private __sendActorsToTheirPool(){
    for(let id in this._entities){
      if(this._entities.hasOwnProperty(id) && this._entities[id]){
        switch(this._entities[id].entityType){
          case ENTITY_TYPE.ACTOR: DisplayActor.pool.free(this._entities[id]); break;
          case ENTITY_TYPE.FOOD: DisplayFood.pool.free(this._entities[id]); break;
          case ENTITY_TYPE.FART_SHOOT: DisplayFartShoot.pool.free(this._entities[id]); break;
          case ENTITY_TYPE.MEDICINE: DisplayMedicine.pool.free(this._entities[id]); break;
          case ENTITY_TYPE.POWER_UP: DisplayPowerUp.pool.free(this._entities[id]); break;
        }
      }
    }
  }

  private __checkCameraOffset(){
    if(this._fixedCamFactor !== -1)return;
    const offset:number = distanceBetween(this._myActor.position.x, this._myActor.position.y, this._cameraPosition.x, this._cameraPosition.y);

    if(offset > this._cameraOffset){
      let distance:number = offset-this._cameraOffset;
      let angle:number = angleBetween(this._myActor.position.x, this._myActor.position.y, this._cameraPosition.x, this._cameraPosition.y);
      this._cameraPosition.x -= distance*Math.cos(angle);
      this._cameraPosition.y -= distance*Math.sin(angle);
    }
  }

  private __createDisplayActor(data:ActorCreateConfig):DisplayActor{
    let actor:DisplayActor = DisplayActor.pool.alloc();
    actor.initialize(this, data.skin);
    if(!actor.massTween)actor.addMassTween(this.tweenManager.createTween(actor));
    actor.position.set(data.x,data.y);
    actor.width = actor.height = data.radius*2;
    actor.name = data.name || "";
    actor.mass = data.mass;
    this.world.addChild(actor);
    ActorHelper.createPool.free(data);
    return actor;
  }

  private __createDisplayMedicine(data:MedicineCreateConfig):DisplayMedicine{
    let medicine:DisplayMedicine = DisplayMedicine.pool.alloc();
    medicine.initialize(this);
    medicine.position.set(data.x, data.y);
    medicine.width = medicine.height = data.radius*2;
    medicine.mass = 10;
    this.world.addChild(medicine);
    MedicineHelper.createPool.free(data);
    return medicine;
  }

  private __createDisplayFood(data:FoodCreateConfig):DisplayFood{
    let food:DisplayFood = DisplayFood.pool.alloc();
    food.initialize(data.mass === 1);
    food.position.set(data.x, data.y);
    food.width = food.height = data.radius*2;
    food.mass = data.mass;
    this._particleContainer.addChild(food);
    food.createEffect();
    FoodHelper.createPool.free(data);
    return food;
  }

  private __createDisplayFartShoot(data:FartShootCreateConfig):DisplayFartShoot{
    let fart:DisplayFartShoot = DisplayFartShoot.pool.alloc();
    fart.initialize();
    fart.position.set(data.x, data.y);
    fart.width = fart.height = data.radius*2.1;
    fart.mass = data.mass;

    if(data.fartType === 0){
      fart.tint = 0xffffff;
    }else{
      fart.tint = 0xff0000;
    }

    this.world.addChild(fart);
    FartShootHelper.createPool.free(data);
    return fart;
  }

  private __createDisplayPowerUp(data:PowerUpCreateConfig):DisplayPowerUp{
    let pill:DisplayPowerUp = DisplayPowerUp.pool.alloc();
    pill.initialize(this);
    pill.position.set(data.x, data.y);
    pill.width = pill.height = data.radius*2;
    pill.powerType = data.powerType;

    this.world.addChild(pill);
    if(!pill.tween){
      pill.addTween(this.tweenManager.createTween(pill));
    }
    PowerUpHelper.createPool.free(data);
    return pill;
  }

  private __shake(time:number, force:number = 4){
    this._shakeTime = time/1000;
    this._shakeForce = force;
    vibrate(time+100);
  }

  private __sendInput(){
    this._inputTime = 0;
    this.world.toLocal(this._inputPoint, (this.game.accel) ? this.ui : null, tmpPoint);
    const angle:number = Math.atan2(tmpPoint.y - this._myActor.position.y, tmpPoint.x - this._myActor.position.x);
    const distance:number = Math.sqrt((this._myActor.position.x - tmpPoint.x)*(this._myActor.position.x - tmpPoint.x)+(this._myActor.position.y - tmpPoint.y)*(this._myActor.position.y - tmpPoint.y));
    const force:number = distance <= 0 ? 0 : Math.round(Math.min(1, distance/100)*10);
    this.sendNetworkInput(angle, force, this._fast, this._fireKey, this._firePepper);
    this._fireKey = false;
    this._firePepper = false;
  }

  private __init():void{
    this._initialized = true;
    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background = new PIXI.extras.TilingSprite(PIXI.loader.resources["tileBack"].texture, max, max);
    //this.background.tint = 0x0fff00;
    this.background.tileScale.set((this._internalScale/this.background.scale.x)*2);//this.background.pivot.set(this.background.width/2, this.background.height/2);
    this.background.anchor.set(0.5);

    this.addChildAt(this.background, 0);

    this._particleContainer = new PIXI.ParticleContainer(15000, {
      scale: true,
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });

    (this._particleContainer as any).topIndex = true;

    this.world.addChild(this._particleContainer);

    this._miniMap = new MiniMap();
    this.ui.addChild(this._miniMap);

    this._scoreUI = new ScoreUI();
    this.ui.addChild(this._scoreUI);

    this._leaderboard = new Leaderboard();
    this.ui.addChild(this._leaderboard);

    this._outArrow = new DisplayOutArrow(this);
    this._outArrow.scale.set(0.5);
    this._outArrow.hide();
    this.ui.addChild(this._outArrow);

    this._pixelateTween = this.tweenManager.createTween(this._pixelateFilter);
    this._grayTween = this.tweenManager.createTween(this._grayFilter);
    this._sepiaTween = this.tweenManager.createTween(this._sepiaFilter);
    this._rgbTween = this.tweenManager.createTween(this._rgbSplitFilter);
    this._blurTween = this.tweenManager.createTween(this._blurFilter);
    this._colorStepTween = this.tweenManager.createTween(this._colorStepFilter);
    this._waveTween = this.tweenManager.createTween(this._shockWaveFilter);
    this._closeFilters = [this._pixelateFilter, this._grayFilter];

    this._rgbSplitFilter.red.x = -5;
    this._rgbSplitFilter.red.y = 5;
    this._rgbSplitFilter.green.x = 5;
    this._rgbSplitFilter.green.y = -5;
    this._rgbSplitFilter.blue.x = 5;
    this._rgbSplitFilter.blue.y = 5;

    this._blurFilter.blurX = 0;
    this._blurFilter.blurY = 0;

    this._colorStepFilter.step = 100;

    this._shockWaveFilter.params.x = 5;

    this._buttonFast = new FastButton();
    this.ui.addChild(this._buttonFast);

    this._buttonFart = new FartButton;
    this.ui.addChild(this._buttonFart);

    this._buttonPepper = new PepperButton();
    this.ui.addChild(this._buttonPepper);

    this._crazyBar = new CrazyBar();
    this.ui.addChild(this._crazyBar);
    //this._crazyBar.visible = false;

    if(!isDesktop){
      this._buttonFast.interactive = true;
      this._buttonFast.on('touchstart', this.__onMouseDown);
      this._buttonFast.on('touchend', this.__onMouseUp);
      this._buttonFast.on('touchendoutside', this.__onMouseUp);

      this._buttonFart.interactive = true;
      this._buttonFart.on('tap', ()=>{
        this.fire();
      });
      this._buttonPepper.interactive = true;
      this._buttonPepper.on('tap', ()=>{
        this.pepper();
      });
    }

    this._transition = new DisplayTransition(this);
    this._transition.visible = false;
    this.ui.addChild(this._transition);
  }

  private __slowEffect(){
    let radius:number = this._myActor ? this._myActor.radius : 100;
    this.__shake(400, 3 + Math.ceil(radius/100));
    this.__applyFilter(this._blurFilter, this._colorStepFilter);

    this._blurTween.stop();
    this._blurTween.reset();
    this._blurTween.pingPong = true;
    this._blurTween.time = 600;
    this._blurTween.from({
      blur: 0
    });
    this._blurTween.to({
      blur: 10
    });

    this._blurTween.start();

    this._colorStepTween.stop();
    this._colorStepTween.reset();
    this._colorStepTween.pingPong = true;
    this._colorStepTween.time = 600;
    this._colorStepTween.from({
      step: 100,
    });
    this._colorStepTween.to({
      step: 20
    });
    this._colorStepTween.start();
    this._colorStepTween.once('end', ()=>this.__removeFilter(this._blurFilter, this._colorStepFilter));
  }

  private __onActorSlow = (value:boolean)=>{
    if(value)this.__slowEffect();
  };

  private __onActorCrazy = (value:boolean)=>{
    this._rgbTween.loop = true;
    this._rgbTween.pingPong = true;
    this._rgbTween.from({
      red: {x:-8, y:8},
      green: {x:8, y:-8},
      blue: {x:8, y:8}
    });
    this._rgbTween.to({
      red: {x:8, y:8},
      green: {x:-8, y:8},
      blue: {x:8, y:-8}
    });

    this._rgbTween.time = 1000;

    if(value){
      this.__applyFilter(this._rgbSplitFilter);
      this._rgbTween.start();
      this._crazyBar.visible = true;
    }else{
      this.__removeFilter(this._rgbSplitFilter);
      this._rgbTween.stop();
      this._crazyBar.visible = false;
    }
  };

  private __onMouseMove = (evt)=>{
    this._inputPoint.copy(evt.data.global);
  };

  private __onMouseDown = (evt)=>{
    if(!this._fast){
      this._fast = true;
      this.__sendInput();
    }
  };

  private __onMouseUp = (evt)=>{
    if(this._fast){
      this._fast = false;
      this.__sendInput();
    }
  };
}
