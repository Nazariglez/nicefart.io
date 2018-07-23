/**
 * Created by nazarigonzalez on 4/8/16.
 */
import {parseSkinConfig, generateSkinConfig, basicSkin} from "../../common/skins";
import {MODE} from "../scenes/SkinSelectorScene";
import {customSkinConfig} from "../../common/interfaces";
import Game from "../Game";
import {isApp} from "../helpers/device";

const degToRad90:number = 90*PIXI.DEG_TO_RAD;
const ALPHA = 1;
const AURA_ALPHA = 0.7;

export default class ButtonSkinSelector extends PIXI.Sprite{
  private _extras:PIXI.Sprite[] = [];
  private _over:boolean = false;
  private _aura:PIXI.Sprite;
  private _title:PIXI.Text;

  constructor(public game:Game){
    super();
    this.anchor.set(0.5);
    this.interactive = true;
    this.on('mouseover', this.__onMouseOver);
    this.on('mouseout', this.__onMouseOut);
    this.on('click', this.__onClick);
    this.on('tap', this.__onClick);
    this.buttonMode = true;
    this.defaultCursor = "pointer";
    this.alpha = 1;//isApp ? 0.8 : ALPHA;

    this._aura = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["aura.png"]);
    //this._aura.tint = 0x0fffff;
    this._aura.tint = 0x00ff00;
    this._aura.scale.set(3.5);
    this._aura.anchor.set(0.5);
    this._aura.alpha = 0;
    //this._aura.visible = false;

    this._aura.blendMode = PIXI.BLEND_MODES.ADD;

    /*this._title = new PIXI.Text("Skins", {
      fill: "#ffffff",
      font: "150px Ubuntu",
      stroke: "#000000",
      strokeThickness: 30
    });
    this._title.resolution = 2;
    this._title.scale.set(0.5);
    this._title.anchor.set(0.5);*/
    this.drawSkin();
  }

  onClick(evt:any){

  }

  drawSkin(){
    this.__loadData();
  }

  drawConfig(config:customSkinConfig){
    this.children.length = 0;
    this.addChild(this._aura);

    this.texture = PIXI.loader.resources["nicefart1"].textures[this.game.skins.textures[config.skin.texture]];
    console.log(this.game.skins.textures[config.skin.texture], this.texture);
    this.tint = config.skin.color || 0xffffff;

    if(config.costume){
      config.costume.textures.forEach((texture:number[], i:number)=>{
        if(!this._extras[i]){
          this._extras[i] = new PIXI.Sprite();
        }

        this._extras[i].anchor.set(0.5);
        this._extras[i].texture = PIXI.loader.resources["nicefart1"].textures[this.game.skins.textures[texture[0]]];
        this._extras[i].tint = texture[1] || 0xffffff;

        this.addChildAt(this._extras[i], i);
      });
    }

    /*this.addChild(this._title);
    this._title.position.set(
      0,
      -(this.texture.height/2)*1.1
    );*/
  }

  update(delta:number){
    super.update(delta);
    if(isApp)return;

    if(this._over){
      if(this.alpha < 1){
        this.alpha += delta;
        if(this.alpha > 1)this.alpha = 1;
      }
      if(this._aura.alpha < AURA_ALPHA){
        this._aura.alpha += 1.5*delta;
      }
    }else{
      if(this.alpha > ALPHA){
        this.alpha -= delta;
      }
      if(this._aura.alpha > 0){
        this._aura.alpha -= 1.5*delta;
      }
    }

    if(this._aura.alpha > 0){
      this._aura.rotation += Math.random() * delta * degToRad90;
    }
  }

  private __onMouseOver = ()=>{
    this._over = true;
  };

  private __onMouseOut = ()=>{
    this._over = false;
  };

  private __onClick = (evt:any)=>{
    console.log('click');
    this.onClick(evt);
  };

  private __loadData(){
    if(this.game.user && this.game.user.skinID && this.game.skins && this.game.skins.skins && this.game.skins.skins.length){
      this.drawConfig(this.game.user.getSkinConfig());
    }else{
      this.drawConfig(basicSkin);
    }
  }
}