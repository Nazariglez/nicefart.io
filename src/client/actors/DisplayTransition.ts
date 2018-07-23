/**
 * Created by nazarigonzalez on 18/9/16.
 */
import AbstractScene from "../scenes/AbstractScene";

const texture:PIXI.Texture = new PIXI.Graphics()
  .beginFill(0x202020)
  .drawRect(0, 0, 128, 128)
  .endFill()
  //.lineStyle(4, 0x000000, 1)
  //.moveTo(0, 0)
  //.lineTo(128, 0)
  .generateTexture(null);

export default class DisplayTransition extends PIXI.Container{
  private _tweenTop:PIXI.tween.Tween;
  private _tweenBottom:PIXI.tween.Tween;
  private _tweenText:PIXI.tween.Tween;
  private _bgTop:PIXI.Sprite = new PIXI.Sprite(texture);
  private _bgBottom:PIXI.Sprite = new PIXI.Sprite(texture);
  private _text:PIXI.Text;

  private _animationTime:number = 1000;
  private _cb:()=>void = function(){};

  opened:boolean = false;

  constructor(public scene:AbstractScene){
    super();
    this._bgTop.anchor.set(0, 1);
    this._bgBottom.anchor.set(1, 0);
    //this._bgBottom.scale.y = -1;
    this.addChild(this._bgTop);
    this.addChild(this._bgBottom);

    this._text = new PIXI.Text(" Game Over", {
      font: "35px Ubuntu",
      stroke: "#909090",
      fill: 0xffffff,
      strokeThickness: 6,
      align: "center"
    });
    this._text.alpha = 0;
    this._text.anchor.set(0.5);
    this._text.position.y = -2;
    this.addChild(this._text);


    this._tweenTop = this.scene.tweenManager.createTween(this._bgTop);
    this._tweenBottom = this.scene.tweenManager.createTween(this._bgBottom);
    this._tweenText = this.scene.tweenManager.createTween(this._text);
  }

  showBg(){
    const ww1:number = this.scene.renderer.width/this.scene.ui.scale.x;
    const hh1:number = this.scene.renderer.height/this.scene.ui.scale.y;

    this._bgTop.position.x = -ww1/2;
    this._bgBottom.position.x = ww1/2;
    this._bgTop.position.y = this._bgBottom.position.y = 0;
    this._bgTop.width = this._bgBottom.width = ww1;
    this._bgTop.height = this._bgBottom.height = hh1/2;
    this._text.alpha = 0;
    this.opened = true;
  }

  open(_time:number = this._animationTime, cb:()=>void = this._cb){
    this._animationTime = _time;
    this._cb = cb;

    const time:number = 400;
    this._bgTop.width = this._bgBottom.width = 0;
    this._bgTop.height = this._bgBottom.height = 25;

    const ww1:number = this.scene.renderer.width/this.scene.ui.scale.x;
    this._bgTop.position.x = -ww1/2;
    this._bgBottom.position.x = ww1/2;
    this._bgBottom.position.y = this._bgTop.position.y = 0;

    this._text.alpha = 0;
    this._tweenText.stop();
    this._tweenText.clear();
    this._tweenText.delay = 200;
    this._tweenText.to({
      alpha: 1
    });
    this._tweenText.time = time;
    this._tweenText.start();

    this._tweenTop.stop();
    this._tweenTop.clear();
    this._tweenTop.delay = 200;
    this._tweenTop.time = time;
    this._tweenTop.to({
      width: ww1
    });
    this._tweenTop.easing = PIXI.tween.Easing.inQuad();
    this._tweenTop.start();

    this._tweenBottom.stop();
    this._tweenBottom.clear();
    this._tweenBottom.delay = 200;
    this._tweenBottom.time = time;
    this._tweenBottom.to({
      width: ww1
    });
    this._tweenBottom.easing = PIXI.tween.Easing.inQuad();
    this._tweenBottom.start();
    this._tweenBottom.once('end', this._open2);
  }

  close(time:number = 600, cb?:()=>void){
    const ww1:number = this.scene.renderer.width/this.scene.ui.scale.x;
    const hh1:number = this.scene.renderer.height/this.scene.ui.scale.y;

    this._bgTop.position.x = -ww1/2;
    this._bgBottom.position.x = ww1/2;
    this._bgTop.position.y = this._bgBottom.position.y = 0;
    this._bgTop.width = this._bgBottom.width = ww1;
    this._bgTop.height = this._bgBottom.height = hh1/2;
    this._text.alpha = 0;

    this._tweenTop.stop();
    this._tweenTop.clear();
    this._tweenTop.time = time;
    this._tweenTop.to({
      y: -hh1/2
    });
    this._tweenTop.easing = PIXI.tween.Easing.linear();
    this._tweenTop.start();

    this._tweenBottom.stop();
    this._tweenBottom.clear();
    this._tweenBottom.time = time;
    this._tweenBottom.to({
      y: hh1/2
    });
    this._tweenBottom.easing = PIXI.tween.Easing.linear();
    this._tweenBottom.start();

    this._tweenBottom.once('end', ()=>{
      this.opened = false;
      if(cb){
        cb();
      }
    });
  }

  outPosition(){
    const ww1:number = this.scene.renderer.width/this.scene.ui.scale.x;
    const hh1:number = this.scene.renderer.height/this.scene.ui.scale.y;

    this._bgTop.position.x = -ww1/2;
    this._bgBottom.position.x = ww1/2;
    this._bgTop.position.y = this._bgBottom.position.y = 0;
    this._bgTop.width = this._bgBottom.width = ww1;
    this._bgTop.height = this._bgBottom.height = hh1/2;

    this._bgTop.y = -hh1/2;
    this._bgBottom.y = hh1/2;

  }

  private _open2 = ()=>{
    const time:number = 600;
    const hh1:number = this.scene.renderer.height/this.scene.ui.scale.y;

    this._tweenText.stop();
    this._tweenText.clear();
    this._tweenText.delay = this._animationTime;
    this._tweenText.to({
      alpha: 0
    });
    this._tweenText.time = time*0.7;
    this._tweenText.start();

    this._tweenTop.stop();
    this._tweenTop.clear();
    this._tweenTop.delay = this._animationTime;
    this._tweenTop.time = time;
    this._tweenTop.to({
      height: hh1/2
    });
    this._tweenTop.easing = PIXI.tween.Easing.inSine();
    this._tweenTop.start();

    this._tweenBottom.stop();
    this._tweenBottom.clear();
    this._tweenBottom.delay = this._animationTime;
    this._tweenBottom.time = time;
    this._tweenBottom.to({
      height: hh1/2
    });
    this._tweenBottom.easing = PIXI.tween.Easing.inSine();
    this._tweenBottom.start();
    this._tweenBottom.once('end', this._cb);
  }
}