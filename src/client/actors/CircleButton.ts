/**
 * Created by nazarigonzalez on 21/1/17.
 */

import {isDesktop} from "../helpers/device";

export default class CircleButton extends PIXI.Container {
  private _letter:PIXI.Text;
  private _bg:PIXI.Graphics;
  private _circle:PIXI.Sprite;
  private _circle2:PIXI.Sprite;


  constructor(letter?:string){
    super();

    this._bg = new PIXI.Graphics();
    this._bg.beginFill(0x000000, 0.6)
      .drawCircle(0, 0, 47)
      .endFill();
    this.addChild(this._bg);

    this._circle = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["circlebutton1.png"]);
    this._circle.anchor.set(0.5);
    this._circle.scale.set(2);
    this.addChild(this._circle);

    this._circle2 = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["circlebutton2.png"]);
    this._circle2.anchor.set(0.5);
    this._circle2.scale.set(2);
    this.addChild(this._circle2);
    this._circle2.visible = false;

    if(letter){
      this._letter = new PIXI.Text(letter, {
        fill: 0xffffff,
        font: "50px Ubuntu",
        stroke: "#ffcd4c",
        strokeThickness: 6,
        align: "center"
      });
      this._letter.resolution = 2;
      this._letter.position.set(
        60,
        65
      );
      this._letter.anchor.set(1,1);
      this.addChild(this._letter);
    }

    this.scale.set(isDesktop ? 0.4 : 0.6);
  }

  setWarning(value:boolean){
    if(this._circle2.visible === value)return;
    this._circle2.visible = value;
  }
}