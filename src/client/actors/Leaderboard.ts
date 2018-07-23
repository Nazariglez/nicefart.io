/**
 * Created by nazarigonzalez on 28/8/16.
 */
export default class Leaderboard extends PIXI.Container {
  private _bg:PIXI.Graphics;
  private _titile:PIXI.Text;
  private _top:PIXI.Text[] = [];
  private _myPosition:number = 999;

  private _width:number = 150;
  private _height:number = 205;

  private _colorTop:number = 0xA0FF98;
  private _colorText:number = 0xdcdcdc;

  constructor(){
    super();

    this.visible = false;
    this._bg = new PIXI.Graphics();
    this.addChild(this._bg);

    this._bg.beginFill(0xacacac)
      .drawRoundedRect(-this._width/2, -this._height/2, this._width, this._height, 4)
      .endFill();

    this._bg.alpha = 0.2;

    this._titile = new PIXI.Text(" Leaderboard", {
      fill:0xffffff,
      font: "16px Ubuntu",
      stroke: "#000000",
      strokeThickness: 4
    });
    this._titile.resolution = 2;
    this._titile.position.set(
      -this._titile.width/2,
      -this._height/2+2
    );
    this.addChild(this._titile);

    this.__fillTop();

    this.alpha = 0.8;
  }

  reset(){
    for(let i:number = 0; i < 10; i++)this.setTop(i, "");
    this.setMyPosition(999, "");
    this.visible = false;
  }

  setTop(index:number, name:string){
    if(!this.visible)this.visible = true;

    this._top[index].text = ` ${index+1}.  ${name}`;
    this._top[index].position.set(
      -this._top[index].width/2,
      this._top[index].position.y
    );
  }

  setMyPosition(position:number, name:string){
    if(this._myPosition === position)return;
    this._myPosition = position;

    for(let i:number = 0; i < this._top.length; i++){
      if(this._top[i].tint !== this._colorText)this._top[i].tint = this._colorText;
    }

    if(this._myPosition > 10){
      this._top[this._top.length-1].visible = true;
      this._top[this._top.length-1].text = ` ${position}.  ${name}`;
    }else if(this._myPosition !== 0){
      this._top[this._top.length-1].visible = false;
      this._top[position-1].tint = this._colorTop;
    }

    this._top[this._top.length-1].position.set(
      -this._top[this._top.length-1].width/2,
      this._top[this._top.length-1].position.y
    );
  }

  private __fillTop(){
    for(let i:number = 0; i < 10; i++){
      let text:PIXI.Text = new PIXI.Text(` ${i+1}.  `, {
        fill: this._colorText,
        font: "12px Ubuntu",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center"
      });
      text.resolution = 2;
      text.position.set(
        -text.width/2,
        -this._height/2 + (i+1)*(text.height/2 + 5) + 12
      );
      this.addChild(text);
      this._top.push(text);
    }

    let text:PIXI.Text = new PIXI.Text("...", {
      fill:0x9c9c9c,
      font: "12px Ubuntu",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    });
    text.resolution = 2;
    text.position.set(
      -text.width/2,
      -this._height/2 + (10+1)*(text.height/2 + 5) + 12
    );
    this.addChild(text);
    this._top.push(text);

    let myPosition:PIXI.Text = new PIXI.Text(` ${this._myPosition}.  `, {
      fill: this._colorTop,
      font: "12px Ubuntu",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    });
    myPosition.resolution = 2;
    myPosition.position.set(
      -myPosition.width/2,
      -this._height/2 + (11+1)*(myPosition.height/2 + 5) + 13
    );
    this.addChild(myPosition);
    this._top.push(myPosition);
  }
}