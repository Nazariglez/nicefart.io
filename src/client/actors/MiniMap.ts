/**
 * Created by nazarigonzalez on 25/6/16.
 */
import DisplayActor from "./DisplayActor";

export default class MiniMap extends PIXI.Container {
  private _bg:PIXI.Graphics;
  private _mark:PIXI.Graphics;
  private _food:PIXI.Graphics;
  private _sprite:PIXI.Sprite;

  private _ww:number = 80;
  private _hh:number = 80;

  private _unit:number = 0;

  constructor(){
    super();
    const ww:number = this._ww/2;
    const hh:number = this._hh/2;
    
    this._sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["radar.png"]);
    this._sprite.anchor.set(0.5);
    this._sprite.width = this._ww;
    this._sprite.height = this._hh;
    this._sprite.alpha = 0.8;
    this.addChild(this._sprite);

    this._bg = new PIXI.Graphics();
    this._bg.lineStyle(2, 0xacacac)
      .drawRect(-ww, -hh, this._ww, this._hh);
    this.addChild(this._bg);

    this._food = new PIXI.Graphics();
    this._food.alpha = 0.6;
    this.addChild(this._food);

    this._mark = new PIXI.Graphics();
    this._mark.beginFill(0xff0000, 1)
      .drawCircle(0, 0, 3)
      .endFill();
    this.addChild(this._mark);

    this.alpha = 0.7;
  }

  setUnit(width:number){
    this._unit = this._ww/width;
  }

  drawActor(actor:DisplayActor){
    this._mark.position.set(
      actor.position.x*this._unit,
      actor.position.y*this._unit
    );
  }

  setFoodPosition(data:number[]){
    this._food.clear();
    this._food.beginFill(0x0c0c0c0);

    for(let i:number = 0; i < data.length/2; i++){
      let n:number = i*2;
      this._food.drawCircle(data[n]*this._unit, data[n+1]*this._unit, 1)
    }

    this._food.endFill();
  }
}
