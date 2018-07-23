/**
 * Created by nazarigonzalez on 24/6/16.
 */
import config from '../config';
import {linearInterpolator} from '../../common/utils';
import GameScene from "../scenes/GameScene";
import {ENTITY_TYPE, ACTOR_FLAG, customSkinConfig} from "../../common/interfaces";
import ObjPool from "obj-pool";
import {parseSkinConfig} from '../../common/skins';
import {ActorUpdateConfig, ActorStateConfig, ActorHelper} from "../helpers/ActorHelper";
import {Particle} from "./Particle";
import {fartActorEffect, fastActorEffect, pepperLoadingActorEffect, burningActorEffect} from "../helpers/particles";
import DisplayMulti from "./DisplayMulti";

const warningTexture:PIXI.Texture = new PIXI.Graphics()
  .lineStyle(28, 0xff0000)
  .drawCircle(0, 0, 60)
  .endFill()
  .lineStyle(10, 0xac0000)
  .drawCircle(0, 0, 25)
  .generateTexture(null);

const degToRad90:number = 90*PIXI.DEG_TO_RAD;
const degToRad100:number = 100*PIXI.DEG_TO_RAD;
const degToRad150:number = 150*PIXI.DEG_TO_RAD;
const CRAZY_WARNING_TIME:number = 2000;
const GROW_TIME:number = 500;
const REMOVED_TIME:number = 0.3;
const AURA_TIME:number = 0.4;
const AURA_SCALE:number = 4;
//const AURA_SCALE:number = 2;
const AURA_ALPHA:number = 0.7;

export default class DisplayActor extends PIXI.Sprite{
  static pool:ObjPool<any> = new ObjPool(DisplayActor, {amount:50});
  private _data:ActorStateConfig[] = [];
  private _mass:number = 0;
  private _nameText:PIXI.Text;
  private _outOfBounds:boolean = false;
  private _crazy:boolean = false;
  private _slow:boolean = false;
  private _fast:boolean = false;
  private _extras:PIXI.Sprite[] = [];
  private _radius:number = 0;
  private _tmpRadius:number = 0;
  private _growTimer:number = 0;
  private _light1:PIXI.Sprite;
  private _light2:PIXI.Sprite;
  private _warningLight:PIXI.Sprite;
  private _warningTween:PIXI.tween.Tween;
  private _aura:PIXI.Sprite;
  private _auraTime:number = AURA_TIME;
  private _auraVisible:boolean = false;
  private _fastGlow:PIXI.Sprite;
  private _growEasing:(n:number)=>number = PIXI.tween.Easing.inOutSine();
  private _crazyTime:number = 0;

  private _removed:boolean = false;
  private _removedTime:number = 0;
  private _removedPosition:PIXI.Point = new PIXI.Point();
  private _removedSize:number = 0;
  private _assasin:PIXI.Sprite;
  private _nameTween:PIXI.tween.Tween;
  private _mouseOverMe:boolean = false;
  private _displayMulti:DisplayMulti;
  
  private _generalCrazyTime:number = 0;

  private _fartEffectParticle:Particle;
  private _fastEffectParticle:Particle;
  private _loadingPepperEffectParticle:Particle;
  private _burningEffectParticle:Particle;

  entityType:ENTITY_TYPE = ENTITY_TYPE.ACTOR;
  scene:GameScene;
  massTween:PIXI.tween.Tween;
  peppers:number = 0;
  fastPenalty:boolean = false;
  fastPercent:number = 0;
  crazyTime:number = 0;
  multi:number = 1;

  constructor(){
    super(null);
    this.anchor.set(0.5);
    this.interactive = true;
    this.on('mouseover', ()=>{
      if(this._mouseOverMe)return;
      if(this.scene && this.scene.isMyActor(this))return;
      this.fadeInName();
      this._mouseOverMe = true;
    });

    this.on('mouseout', ()=>{
      if(!this._mouseOverMe)return;
      if(this.scene && this.scene.isMyActor(this))return;
      this.fadeOutName(5000);
      this._mouseOverMe = false;
    });
  }

  initialize(scene:GameScene, config:customSkinConfig){
    this.scene = scene;
    this.alpha = 1;
    this.__parseSkinConfig(config);

    if(!this._displayMulti){
      this._displayMulti = new DisplayMulti();
      this._displayMulti.position.set(
        0, -(this.height/2)/this.scale.y - this._displayMulti.height/2 - 5
      );
      this.addChild(this._displayMulti);
      this._displayMulti.setMulti(1);
      this._displayMulti.visible = false;
    }

    if(!this._nameText){
      this._nameText = new PIXI.Text("", {
        fill: "#ffffff",
        font: "130px Ubuntu",
        stroke: "#000000",
        strokeThickness: 30
      });
      //this._nameText.resolution = 2;
      this._nameText.scale.set(0.5);
      this.addChild(this._nameText);
      this._nameTween = scene.tweenManager.createTween(this._nameText);
      this._nameTween.easing = PIXI.tween.Easing.linear();
    }

    if(!this._light1){
      this._light1 = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["lights3.png"]);
      this._light1.anchor.set(0.5);
      this._light1.scale.set(4);
      //this._light1.scale.set(2);
      this._light1.blendMode = PIXI.BLEND_MODES.ADD;
      this._light1.alpha = 0.6;
      this._light1.visible = false;
      this.addChild(this._light1);
    }

    if(!this._light2){
      this._light2 = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["lights4.png"]);
      this._light2.anchor.set(0.5);
      this._light2.scale.set(4);
      //this._light2.scale.set(2);
      this._light2.blendMode = PIXI.BLEND_MODES.COLOR;
      this._light2.alpha = 0.6;
      this._light2.visible = false;
      this.addChild(this._light2);
    }

    if(!this._warningLight){
      this._warningLight = new PIXI.Sprite(warningTexture);
      this._warningLight.anchor.set(0.5);
      this._warningLight.blendMode = PIXI.BLEND_MODES.ADD;
      this._warningLight.alpha = 0.6;
      this._warningLight.visible = false;
      this.addChild(this._warningLight);

      this._warningTween = this.scene.tweenManager.createTween(this._warningLight);
    }

    if(!this._aura){
      this._aura = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["aura.png"]);
      this._aura.tint = 0xffff00;
      this._aura.scale.set(0);
      this._aura.anchor.set(0.5);
      this._aura.alpha = 0;
      this._aura.visible = false;
      this.addChild(this._aura);

      this._aura.blendMode = PIXI.BLEND_MODES.ADD;
    }

    if(!this._fastGlow){
      this._fastGlow = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["fastglow4.png"]);
      this._fastGlow.anchor.set(0.5);
      this._fastGlow.scale.set(4);
      this._fastGlow.alpha = 0.4;
      this._fastGlow.blendMode = PIXI.BLEND_MODES.ADD;
      this._fastGlow.visible = false;
      this.addChild(this._fastGlow);
    }

    this.fadeInName(0, ()=>{
      this.fadeOutName(5000);
    });

    if(!this._fartEffectParticle){
      this._fartEffectParticle = new Particle();
      this._fartEffectParticle.addConfig(this, PIXI.loader.resources["particles"].textures["smoke.png"], fartActorEffect);
    }

    if(!this._fastEffectParticle){
      this._fastEffectParticle = new Particle();
      this._fastEffectParticle.addConfig(this.scene.world, PIXI.loader.resources["particles"].textures["spark.png"], fastActorEffect);
    }

    if(!this._loadingPepperEffectParticle){
      this._loadingPepperEffectParticle = new Particle();
      this._loadingPepperEffectParticle.addConfig(this.scene.world, PIXI.loader.resources["particles"].textures["smoke.png"], pepperLoadingActorEffect);
    }

    if(!this._burningEffectParticle){
      this._burningEffectParticle = new Particle();
      this._burningEffectParticle.addConfig(this, PIXI.loader.resources["particles"].textures["smoke.png"], burningActorEffect);
      this._burningEffectParticle.setScale(0.5);
    }

  }

  fadeInName(delay:number = 0, cb?:()=>void){
    this._nameText.alpha = 0;
    this._nameTween.stop();
    this._nameTween.reset();
    this._nameTween.removeAllListeners('end');
    this._nameTween.time = 1000;
    this._nameTween.to({
      alpha: 1
    });
    this._nameTween.delay = delay;
    if(cb)this._nameTween.once('end', cb);
    this._nameTween.start();
  }

  fadeOutName(delay:number = 0, cb?:()=>void){
    this._nameTween.stop();
    this._nameTween.reset();
    this._nameTween.removeAllListeners('end');
    this._nameTween.time = 1000;
    this._nameTween.from({
      alpha: this._nameText.alpha
    });
    this._nameTween.to({
      alpha: 0
    });
    this._nameTween.delay = delay;
    if(cb)this._nameTween.once('end', cb);
    this._nameTween.start();
  }

  reset(){
    this._data.length = 0;
    this._mass = 0;
    this._nameText.cacheAsBitmap = false;
    this._nameText.visible = true;
    this._nameText.text = "";
    this._outOfBounds = false;
    this._crazy = false;
    this._crazyTime = 0;
    this.fastPercent = 0;
    this.fastPenalty = false;
    this.scene = null;
    this.tint = 0xE3CEAE;
    this._nameText.tint = 0xffffff;
    this._radius = 0;
    this._tmpRadius = 0;
    this._extras.forEach((extra:PIXI.Sprite)=>{
      extra.tint = 0xffffff;
      this.removeChild(extra);
    });

    this._fartEffectParticle.stop();
    this._fastEffectParticle.stop();
    this._loadingPepperEffectParticle.stop();
    this._burningEffectParticle.stop();

    this._mouseOverMe = false;
    this._aura.scale.set(0);
    this._aura.visible = false;
    this._aura.alpha = 0;
    this._auraTime = AURA_TIME;
    this._auraVisible = false;
    this._light1.visible = false;
    this._light2.visible = false;
    this._light1.scale.set(4);
    //this._light1.scale.set(2);
    this._light2.scale.set(4);
    //this._light2.scale.set(2);
    this._warningLight.visible = false;
    this._fastGlow.visible = false;
    this._warningTween.stop();
    this.removeAllListeners("crazy");
    this.removeAllListeners("slow");
    this._removedPosition.set(0);
    this._removedSize = 0;
    this._removed = false;
    this.alpha = 1;
    this.multi = 1;
    this._displayMulti.setMulti(1);
    this._displayMulti.visible = false;
  }

  displayAura(visible:boolean = true){
    if(this._auraVisible === visible)return;

    if((visible&&!this._auraVisible)||(!visible&&this._auraVisible)){
      this._auraTime = 0;
    }

    this._auraVisible = visible;
  }

  addMassTween(tween:PIXI.tween.Tween){
    this.massTween = tween;
    this.massTween.easing = PIXI.tween.Easing.inOutElastic();
  }

  growUp(){
    if(!this.massTween)return;
    if(this._tmpRadius!==this._radius){

      this.massTween.stop();
      this.massTween.clear();
      this.massTween.easing = this._growEasing;
      this.massTween.to({
        width: this._radius*2,
        height: this._radius*2
      });
      this.massTween.time = GROW_TIME;
      this.massTween.start();

      this._tmpRadius = this._radius;
    }
  }

  addData(delta:number, data:ActorUpdateConfig){
    if(config.game.interpolation){
      const state:ActorStateConfig = ActorHelper.statePool.alloc();
      state.time = 0;
      state.totalTime = delta;
      state.data = data;
      this._data.push(state);
      if(this._data.length > 5){
        const _state:ActorStateConfig = this._data.shift();
        ActorHelper.statePool.free(_state);
      }
    }else{
      this.__setCurrentData(data);
    }

    this._radius = data.radius;
    const out:boolean = !!(data.flags&ACTOR_FLAG.OUT);
    const crazy:boolean = !!(data.flags&ACTOR_FLAG.CRAZY);
    const slow:boolean = !!(data.flags&ACTOR_FLAG.SLOW);
    const fast:boolean = !!(data.flags&ACTOR_FLAG.FAST);
    const burning:boolean = !!(data.flags&ACTOR_FLAG.BURNING);
    const loadingPepper:boolean = !!(data.flags&ACTOR_FLAG.LOADING_PEPPER);
    const fastPenalty:boolean = !!(data.flags&ACTOR_FLAG.FAST_PENALTY);
    const multi:number = (!!(data.flags&ACTOR_FLAG.MULTI3)) ?  3 : ((!!(data.flags&ACTOR_FLAG.MULTI2)) ? 2 : 1);

    if(multi !== this.multi){
      this.multi = multi;
      if(this.multi === 1){
        this._displayMulti.visible = false;
      }else{
        this._displayMulti.setMulti(this.multi);
        this._displayMulti.visible = true;
      }
    }

    this.peppers = data.peppers;

    if(fast && !this._fast){
      this._fast = true;
      this._fastGlow.visible = true;
      this._fastEffectParticle.setScale(this.__particleScale()*1.3);
      this._fastEffectParticle.updatePos(this.position.x, this.position.y, true);
      this._fastEffectParticle.start();
    }else if(!fast && this._fast){
      this._fast = false;
      this._fastGlow.visible = false;
      this._fastEffectParticle.stop();
    }

    if(out && !this._outOfBounds){
      this.__setOutOfBoundsState(true);
    }else if(!out && this._outOfBounds){
      this.__setOutOfBoundsState(false);
    }

    if(crazy && !this._crazy){
      this._generalCrazyTime = data.crazyTime;
      this.__setCrazy(true, data.crazyTime);
    }else if(!crazy && this._crazy){
      this.__setCrazy(false);
    }

    if(this._generalCrazyTime !== 0 && this.scene.isMyActor(this)){
      this.crazyTime = (data.crazyTime*100)/this._generalCrazyTime;
    }

    if(slow && !this._slow){
      this.__setSlow(true);
    }else if(!slow && this._slow){
      this.__setSlow(false);
    }

    if(loadingPepper && !this._loadingPepperEffectParticle.isRunning){
      this._loadingPepperEffectParticle.setScale(this.__particleScale());
      this._loadingPepperEffectParticle.updatePos(this.position.x, this.position.y, true);
      this._loadingPepperEffectParticle.start();
    }else if(this._loadingPepperEffectParticle.isRunning && !loadingPepper){
      this._loadingPepperEffectParticle.stop();
    }

    if(burning && !this._burningEffectParticle.isRunning){
      //this._burningEffectParticle.setScale(this.__particleScale());
      //this._burningEffectParticle.updatePos(this.position.x, this.position.y, true);
      this._burningEffectParticle.start();
    }else if(this._burningEffectParticle.isRunning && !burning){
      this._burningEffectParticle.stop();
    }

    this.fastPenalty = fastPenalty;
    this.fastPercent = data.fastPercent;

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

    if(this._crazy){
      let rotSpeed:number = 1;
      if(this._crazyTime){
        if(this._crazyTime <= CRAZY_WARNING_TIME){
          const scale:number = linearInterpolator(0, 4, CRAZY_WARNING_TIME, this._crazyTime);
          //const scale:number = linearInterpolator(0, 2, CRAZY_WARNING_TIME, this._crazyTime);
          this._light1.scale.x = this._light1.scale.y = scale;
          this._light2.scale.x = this._light2.scale.y = scale;
          rotSpeed = this._crazyTime/CRAZY_WARNING_TIME;
        }
      }

      this._light1.rotation += degToRad100*delta*rotSpeed;
      this._light2.rotation -= degToRad150*delta*rotSpeed;
    }

    if(this._fastGlow.visible){
      this._fastEffectParticle.updatePos(this.position.x, this.position.y);
      this._fastGlow.rotation += degToRad150*delta;
    }

    if(this._loadingPepperEffectParticle.isRunning){
      this._loadingPepperEffectParticle.updatePos(this.position.x, this.position.y);
    }

    this._growTimer += delta;
    if(config.game.interpolation && this._data.length >= 2){
      this.__interpolate(delta);
    }

    this.__updateAura(delta);

    if(this._growTimer >= GROW_TIME/1000){
      this._growTimer = 0;
      this.growUp();
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
      DisplayActor.pool.free(this);
    }
  }

  isNearTo(actor:DisplayActor):boolean{
    const min:number = Math.min(this.width, actor.width)*0.75;
    const size1:number = this.width*0.5 + min;
    const size2:number = actor.width*0.5 + min;

    if(this.position.x+size1 < actor.position.x-size2)return false;
    if(this.position.x-size1 > actor.position.x+size2)return false;
    if(this.position.y+size1 < actor.position.y-size2)return false;
    if(this.position.y-size1 > actor.position.y+size2)return false;

    return true;
  }

  displayName(visible:boolean = true){
    this._nameText.visible = visible;
  }

  private __updateAura(delta:number){
    if(this._auraTime < AURA_TIME){
      let scale:number;
      let alpha:number;
      if(this._auraVisible){
        scale = linearInterpolator(0, AURA_SCALE, AURA_TIME, this._auraTime);
        alpha = linearInterpolator(0, AURA_ALPHA, AURA_TIME, this._auraTime);
      }else{
        scale = linearInterpolator(AURA_SCALE, 0, AURA_TIME, this._auraTime);
        alpha = linearInterpolator(AURA_ALPHA, 0, AURA_TIME, this._auraTime);
      }
      this._aura.scale.set(scale);
      this._aura.alpha = alpha;
      this._auraTime += delta;
    }

    if(this._aura.visible){
      this._aura.rotation += Math.random() * delta * degToRad90;

      if(!this._auraVisible&&this._auraTime >= AURA_TIME)this._aura.visible = false;
    }else if(this._auraVisible){
      this._aura.visible = true;
    }
  }

  private __parseSkinConfig(config:customSkinConfig){
    //const _config:any = parseSkinConfig(config);
    let textures:string[] = this.scene.game.skins.textures;
    this.texture = PIXI.loader.resources["nicefart1"].textures[textures[config.skin.texture]];
    this.tint = config.skin.color || 0xffffff;
    this.scale.set(1);

    config.costume.textures.forEach((value:number[], i:number)=>{
      if(!this._extras[i]){
        this._extras[i] = new PIXI.Sprite();
      }

      this._extras[i].anchor.set(0.5);
      this._extras[i].texture = PIXI.loader.resources["nicefart1"].textures[textures[value[0]]];
      this._extras[i].tint = value[1] || 0xffffff;

      this.addChildAt(this._extras[i], i);
    });
  }

  private __setOutOfBoundsState(state:boolean){
    this._outOfBounds = state;
    switch (this._outOfBounds){
      case true:
        this._warningTween.stop();
        this._warningTween.reset();
        this._warningTween.time = 420;
        this._warningTween.easing = PIXI.tween.Easing.outExpo();
        this._warningTween.loop = true;
        this._warningTween.from({
          width: 10,
          height: 10
        });
        this._warningTween.to({
          width: (this.width*1.8)/this.scale.x,
          height: (this.height*1.8)/this.scale.y
        });
        this._warningTween.start();
        this._warningLight.visible = true;
        this._nameText.tint = 0xff0000;
        break;
      case false:
        this._nameText.tint = 0xffffff;
        this._warningTween.stop();
        this._warningLight.visible = false;
        break;
    }
    this.scene.outAnimation(this._outOfBounds, this);
  }

  private __particleScale() {
    return 0.5 + this.scale.x*0.45;
  }

  private __setSlow(state:boolean){
    this._slow = state;
    switch (this._slow){
      case true:
        this.emit('slow', true);
        this._fartEffectParticle.setScale(2);
        //this._fartEffectParticle.updatePos(this.position.x, this.position.y, true);
        this._fartEffectParticle.start();
        break;
      case false:
        this.emit('slow', false);
        this._fartEffectParticle.stop();
        break;
    }
  }

  private __setCrazy(state:boolean, time?:number){
    this._crazy = state;
    switch (this._crazy){
      case true:
        this._crazyTime = Date.now();
        this._light1.scale.set(4);
        //this._light1.scale.set(2);
        this._light2.scale.set(4);
        //this._light2.scale.set(2);
        this._light1.visible = true;
        this._light2.visible = true;
        this._crazyTime = time;
        this.emit('crazy', true);
        break;
      case false:
        this.emit('crazy', false);
        this._crazyTime = 0;
        this._light1.visible = false;
        this._light2.visible = false;
        break;
    }
  }

  private __interpolate = (delta:number)=>{
    const prev:any = this._data[0];
    const current:any = this._data[1];
    prev.time += delta;

    this.position.x = linearInterpolator(prev.data.x, current.data.x, current.totalTime, prev.time);
    this.position.y = linearInterpolator(prev.data.y, current.data.y, current.totalTime, prev.time);

    //Don't interpolate if the crazytime is smaller than the new value
    if(prev.data.crazyTime > current.data.crazyTime){
      this._crazyTime = linearInterpolator(prev.data.crazyTime, current.data.crazyTime, current.totalTime, prev.time);
    }

    this.mass = current.data.mass;

    if(prev.time >= current.totalTime){
      let offset:number = prev.time - current.totalTime;

      const _state:ActorStateConfig = this._data.shift();
      ActorHelper.statePool.free(_state);

      if(offset&&this._data.length >= 2){
        this.__interpolate(offset);
      }
    }
  };

  private __setCurrentData(data:ActorUpdateConfig){
    this.position.x = data.x;
    this.position.y = data.y;
    this.width = this.height = data.radius*2;
    this.mass = data.mass;
  }

  get radius():number {return this._radius;};

  get mass():number{return this._mass;};
  set mass(value:number){
    if(this._mass !== value){
      this._mass = value;
    }
  }

  get name():string {return this._nameText.text;};
  set name(value:string){
    if(value !== this._nameText.text){
      this._nameText.text = value;
      this._nameText.position.set(
        -this._nameText.width/2, -(this.height/2-5)/this.scale.y - this._nameText.height
      );
      this._nameText.cacheAsBitmap = true;
    }
  }

  get crazy():boolean{return this._crazy;};
  get out():boolean{return this._outOfBounds;};
}
