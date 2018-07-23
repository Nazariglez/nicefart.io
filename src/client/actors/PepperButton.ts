/**
 * Created by nazarigonzalez on 21/1/17.
 */

import CircleButton from "./CircleButton";
import {isDesktop} from "../helpers/device";
import {Particle} from "./Particle";
import {pepperButtonEffect} from "../helpers/particles";

export default class PepperButton extends CircleButton {
  private _particle:Particle;
  private _peppersText:PIXI.Text;
  private _peppers:number = 0;

  constructor(){
    super(isDesktop ? "E" : null);
    this._particle = new Particle();

    this._peppersText = new PIXI.Text("0", {
      fill: 0xffffff,
      font: "40px Ubuntu",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center"
    });
    this._peppersText.resolution = 2;
    this._peppersText.anchor.set(1, 0);
    this._peppersText.position.set(
      58,
      -60
    );
    this.addChild(this._peppersText);

    this._particle.addConfig(
      this,
      PIXI.loader.resources["particles"].textures["smoke.png"],
      pepperButtonEffect
    );
  }

  setPeppers(n:number){
    if(n === this._peppers)return;
    if(this._peppers === 0 && n > 0){
      this._particle.start();
      this.setWarning(false);
    }else if(this._peppers > 0 && n <= 0){
      this._particle.stop();
      this.setWarning(true);
    }

    this._peppers = n;
    this._peppersText.text = n.toString();
  }
}