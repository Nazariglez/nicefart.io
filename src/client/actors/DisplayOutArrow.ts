/**
 * Created by nazarigonzalez on 24/9/16.
 */
import GameScene from "../scenes/GameScene";

export default class DisplayOutArrow extends PIXI.Sprite {
  private _arrow:PIXI.Sprite;
  private _tween:PIXI.tween.Tween;

  constructor(public scene:GameScene){
    super(null);

    this.anchor.set(0.5);

    this._arrow = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["out-arrow.png"]);
    this._arrow.anchor.set(0.5);
    this._arrow.position.set(30, 0);
    this.addChild(this._arrow);

    this._tween = this.scene.tweenManager.createTween(this._arrow);
    this._tween.from({
      x: 30
    });
    this._tween.to({
      x: -30
    });
    this._tween.pingPong = true;
    this._tween.loop = true;
    this._tween.time = 600;
  }

  show(){
    this.visible = true;
    this._tween.start();
  }

  hide(){
    this.visible = false;
    this._tween.stop();
  }
}