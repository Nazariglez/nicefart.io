/**
 * Created by nazarigonzalez on 21/1/17.
 */

import CircleButton from "./CircleButton";
import {isDesktop} from "../helpers/device";
import {Particle} from "./Particle";
import {fastButtonEffect} from "../helpers/particles";

export default class FastButton extends CircleButton {
  private _particle:Particle;
  private _text:PIXI.Text;

  private _percent:number = 0;
  private _penalty:boolean = false;

  constructor(){
    super(isDesktop ? "Q" : null);
    this._particle = new Particle();
    this._particle.addConfig(
      this,
      PIXI.loader.resources["particles"].textures["spark.png"],
      fastButtonEffect
    );

    this._text = new PIXI.Text("0", {
      fill: 0xffffff,
      font: "40px Ubuntu",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center"
    });
    this._text.resolution = 2;
    this._text.anchor.set(1, 0);
    this._text.position.set(
      58,
      -60
    );
    this.addChild(this._text);
  }

  setPercent(percent, penalty){
    if(this._percent === percent && this._penalty === penalty)return;

    if(penalty !== this._penalty){
      if(penalty){
        this.setWarning(true);
        this._particle.stop();
      }else if(percent > 0){
        this.setWarning(false);
        this._particle.start();
      }
    }

    if(percent <= 0 && this._percent > 0){
      this.setWarning(true);
      this._particle.stop();
    }else if(percent > 0 && this._percent <= 0 && !penalty){
      this.setWarning(false);
      this._particle.start();
    }

    this._text.text = percent.toString();
    this._percent = percent;
    this._penalty = penalty;

  }
}