/**
 * Created by nazarigonzalez on 29/1/17.
 */
export default class DisplayMulti extends PIXI.Container {
  private _bean:PIXI.Sprite;
  private _multiText:PIXI.Text;

  constructor(){
    super();
    this._bean = new PIXI.Sprite(PIXI.loader.resources["general"].textures["bean2.png"]);
    this._bean.anchor.set(0.5);
    this._bean.scale.set(2);
    this.addChild(this._bean);

    this._multiText = new PIXI.Text("", {
      fill:0x60ff00,
      stroke:"#000000",
      strokeThickness: 8,
      font: "90px Ubuntu",
      align: "center"
    });
    this._multiText.anchor.set(0.5);
    this._multiText.resolution = 2;
    this.addChild(this._multiText);
  }

  setMulti(n:number){
    this._multiText.text = `x${n}`;
  }
}