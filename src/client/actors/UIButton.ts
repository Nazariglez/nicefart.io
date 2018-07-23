/**
 * Created by nazarigonzalez on 6/5/17.
 */

export default class UIButton extends PIXI.Container {
  private _bg:PIXI.Graphics = new PIXI.Graphics();
  private _text:PIXI.Text;

  private _overMe:boolean = false;

  color:number = 0x00f0ff;
  disabledColor:number = 0x6f6f6f;

  constructor(private _name:string, private _ww:number, private _hh:number){
    super();
    this.addChild(this._bg);

    this.interactive = true;

    this.on('click', this.__onClick);
    this.on('tap', this.__onClick);
    this.on('mouseover', this.__onOver);
    this.on('mouseout', this.__onOut);

    this._text = new PIXI.Text("",{
      fill:"#ffffff",
      stroke:"#000000",
      strokeThickness: 2,
      font: "13px Ubuntu",
      align: "center"
    });
    this._text.resolution = 2;
    this._text.anchor.set(0.5);
    this._text.y = -1;
    this.addChild(this._text);

    this.draw();
    this.buttonMode = true;
    this.defaultCursor = "pointer";
  }

  onClick(){}
  onOver(){}
  onOut(){}

  draw(text:string = this._name, width:number = this._ww, height:number = this._hh) {
    this._bg.clear();
    this._bg.beginFill(this._overMe ? this.color : this.disabledColor);
    this._bg.drawRoundedRect(-width/2, -height/2, width, height, 2);
    this._bg.endFill();
    this._bg.lineStyle(1, 0x000000, 1);
    this._bg.drawRoundedRect(-width/2, -height/2, width, height, 2);
    this._text.text = text;
  }

  private __onClick = ()=>{
    this.onClick();
  };

  private __onOver = ()=>{
    if(this._overMe)return;
    this._overMe = true;
    this.draw();
    this.onOver();
  };

  private __onOut = ()=>{
    if(!this._overMe)return;
    this._overMe = false;
    this.draw();
    this.onOut();
  }
}