/**
 * Created by nazarigonzalez on 27/1/17.
 */
export default class CrazyBar extends PIXI.Container {
  private _ww:number = 200;
  private _hh:number = 26;
  private _bar:PIXI.Graphics;
  private _progress:number = 0;

  constructor(){
    super();

    this._bar = new PIXI.Graphics();
    this.alpha = 1;
    this.visible = false;
    this.addChild(this._bar);
  }

  setProgress(n:number){
    if(n === this._progress)return;
    this._progress = n;
    this.__draw();
  }

  private __draw(){
    this._bar.clear();
    let ww:number = this._ww/2;
    let hh:number = this._hh/2;
    let size:number = (this._progress*this._ww)/100;
    this._bar.beginFill(0xc0c0c0, 0.8)
      .drawRoundedRect(-ww, -hh, this._ww, this._hh, 8)
      .endFill()
      .beginFill(0x93c04b, 1)
      .drawRoundedRect(-ww, -hh, size, this._hh, 8)
      .endFill()
      .lineStyle(4, 0xffffff, 1)
      .drawRoundedRect(-ww, -hh, this._ww, this._hh, 8);
  }
}