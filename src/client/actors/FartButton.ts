/**
 * Created by nazarigonzalez on 21/1/17.
 */

import CircleButton from "./CircleButton";
import {isDesktop} from "../helpers/device";
import {Particle} from "./Particle";
import {fartButtonEffect} from "../helpers/particles";

export default class FartButton extends CircleButton {
  private _particle:Particle;

  constructor(){
    super(isDesktop ? "W" : null);
    this._particle = new Particle();
    this._particle.addConfig(
      this,
      PIXI.loader.resources["particles"].textures["smoke.png"],
      fartButtonEffect
    );
    this._particle.start();
  }
}