/**
 * Created by nazarigonzalez on 17/7/16.
 */
import Game from "../Game";
import config from '../config';

export type PIXIRenderer = PIXI.CanvasRenderer | PIXI.WebGLRenderer;
const MIN_RES:number = 768;

export default class AbstractScene extends PIXI.Container {
  protected _renderer:PIXIRenderer;
  protected _internalScale:number = 1;

  world:PIXI.Container;
  ui:PIXI.Container;
  tweenManager:PIXI.tween.TweenManager;

  constructor(public game:Game){
    super();
    this._renderer = game.renderer;

    this.tweenManager = new PIXI.tween.TweenManager();

    this.world = new PIXI.Container();
    this.addChild(this.world);

    this.ui = new PIXI.Container();
    this.addChild(this.ui);

    this.onResizeWindow();
  }

  update(delta:number){
    this.tweenManager.update(delta);
    super.update(delta);
  }

  onResizeWindow(){
    this._internalScale = Math.max(MIN_RES/config.game.size,Math.min(this._renderer.width, this._renderer.height)/config.game.size);
    this.world.scale.set(this._internalScale);
    this.ui.scale.set(Math.min(this._renderer.width/config.game.size, this._renderer.height/config.game.size));
    this.position.set(this._renderer.width/2, this._renderer.height/2);
  }

  get renderer(){return this._renderer;};
}

(PIXI.Container.prototype as any).update = function update(delta){
  for(let i:number = 0; i < this.children.length; i++){
    this.children[i].update(delta);
  }
};