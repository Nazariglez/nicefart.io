/**
 * Created by nazarigonzalez on 6/5/17.
 */

export default class UIBlock extends PIXI.Container {
  private _bg:PIXI.Graphics = new PIXI.Graphics();

  constructor(public width:number = 100, public height:number = 100){
    super();
    this.addChild(this._bg);
    this.drawBg(width, height);
  }

  drawBg(width:number, height:number) {
    this._bg.clear();
    this._bg.beginFill(0xffffff);
    this._bg.drawRoundedRect(-width/2, -height/2, width, height, 4);
    this._bg.endFill();
  }

}