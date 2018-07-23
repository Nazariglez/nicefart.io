/**
 * Created by nazarigonzalez on 28/8/16.
 */
let ubuntuFontIntialized:boolean = false;
function initializeFont(){
  ubuntuFontIntialized = true;
  //hack
  new PIXI.Text("initialize text", {
    fill: "#ffffff",
    font: "120px Ubuntu",
    stroke: "#000000",
    strokeThickness: 10
  });
  console.log('Initialized Ubuntu Font');
}

export default class ScoreUI extends PIXI.Container {
  private _size:number = 0;
  private _bg:PIXI.Graphics;
  private _sizeText:PIXI.Text;

  private _width:number = 90;
  private _height:number = 20;

  constructor(){
    super();

    if(!ubuntuFontIntialized)initializeFont();

    this._bg = new PIXI.Graphics();
    this.addChild(this._bg);

    this._bg.beginFill(0xacacac)
      .drawRoundedRect(-this._width/2, -this._height/2, this._width, this._height, 3)
      .endFill();

    this._bg.alpha = 0.3;

    this._sizeText = new PIXI.Text("", {
      fill: 0xffffff,
      font: "14px Ubuntu",
      stroke: "#000000",
      strokeThickness: 4
    });
    this._sizeText.anchor.set(0, 0.5);
    this._sizeText.resolution = 2;
    this.addChild(this._sizeText);

    this.alpha = 0.8;
  }

  set size(value:number){
    if(value !== this._size){
      this._size = value;
      this._sizeText.text = " Size:  " + this._size;
      this._sizeText.position.set(
        -this._sizeText.width/2,0
      );
    }
  }
}