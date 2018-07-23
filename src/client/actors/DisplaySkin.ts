/**
 * Created by nazarigonzalez on 4/8/16.
 */
import {customSkinConfig} from "../../common/interfaces";
import Game from "../Game";

export default class DisplaySkin extends PIXI.Container {
  private _skin:PIXI.Sprite;
  private _extras:PIXI.Sprite[] = [];

  constructor(public game:Game){
    //super(PIXI.loader.resources["general"].textures["skinselector.png"]);
    super();
    //this.anchor.set(0.5);

    this._skin = new PIXI.Sprite();
    this._skin.anchor.set(0.5);
    //this.width = this.height = 300;
  }

  drawConfig(config:customSkinConfig){
    this.children.length = 0;
    this._skin.scale.set(1);
    this.addChildAt(this._skin,0);

    //const _config:any = parseSkinConfig(config);
    this._skin.texture = PIXI.loader.resources["nicefart1"].textures[this.game.skins.textures[config.skin.texture]];
    this._skin.tint = config.skin.color || 0xffffff;

    const scale:number = Math.min(this.width/this._skin.width, this.height/this._skin.height)*0.8;
    this._skin.scale.set(scale);

    if(config.costume){
      config.costume.textures.forEach((texture:number[], i:number)=>{
        if(!this._extras[i]){
          this._extras[i] = new PIXI.Sprite();
        }

        this._extras[i].anchor.set(0.5);
        this._extras[i].texture = PIXI.loader.resources["nicefart1"].textures[this.game.skins.textures[texture[0]]];
        this._extras[i].scale.set(scale);
        this._extras[i].tint = texture[1] || 0xffffff;

        this.addChildAt(this._extras[i], i+1);
      });
    }
  }
}