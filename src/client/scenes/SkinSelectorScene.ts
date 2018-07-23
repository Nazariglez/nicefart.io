/**
 * Created by nazarigonzalez on 4/8/16.
 */
import AbstractScene from "./AbstractScene";
import Game from "../Game";
import DisplaySkin from "../actors/DisplaySkin";
import {track} from "../helpers/track";
import {customSkinConfig, skinConfig, costumeConfig} from "../../common/interfaces";

const validSkins:string[] = ["s0", "s1", "s2", "s3"];
const validCostumes:string[] = ["c0"];

const btn:PIXI.Texture = new PIXI.Graphics()
  .beginFill(0xffffff, 0.8)
  .drawRoundedRect(0, 0, 200, 50, 10)
  .endFill()
  .lineStyle(5, 0x000000)
  .drawRoundedRect(0, 0, 200, 50, 15)
  .generateTexture(null);

export enum MODE {
  SKIN, COSTUME
}

const enableColor:number = 0x8eff72;
const enableOverColor:number = 0x66bf5a;
const enableActiveColor:number = 0x3e793c;

const btnColor:number = 0xffffff;
const btnOverColor:number = 0xf0f0f0;
const btnActiveColor:number = 0xB3CBFA;


export default class SkinSelectorScene extends AbstractScene {
  private _initialized:boolean = false;
  private _skinID:number = 0;
  private _costumeID:number = 0;
  private _mode:MODE = MODE.SKIN;
  private _skin:DisplaySkin;
  private _btnExit:PIXI.Sprite;
  private _btnBackward:PIXI.Sprite;
  private _btnForward:PIXI.Sprite;
  private _btnSkins:PIXI.Sprite;
  private _btnCostumes:PIXI.Sprite;
  private _btnBuy:PIXI.Sprite;
  private _textBuy:PIXI.Text;
  private _adBlockWarningSkin:PIXI.Text;
  private _adBlockWarningCostume:PIXI.Text;

  private _config:customSkinConfig;

  background:PIXI.extras.TilingSprite;

  constructor(public game:Game){
    super(game);

    this.__loadData();
    this.__displayUI();

    if(this._mode === MODE.SKIN){
      this.__drawSkins();
    }else{
      this.__drawCostumes();
    }

    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background = new PIXI.extras.TilingSprite(PIXI.loader.resources["tileBack"].texture, max, max);
    this.background.tileScale.set(this._internalScale/this.background.scale.x);//this.background.pivot.set(this.background.width/2, this.background.height/2);
    this.background.anchor.set(0.5);

    this.addChildAt(this.background, 0);

    this._initialized = true;
  }

  update(delta:number){
    super.update(delta);
    this.background.tilePosition.x -= 30*delta;
  }

  onResizeWindow(){
    super.onResizeWindow();
    if(!this._initialized)return;

    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background.scale.set(max/this.background.width);
    this.background.tileScale.set(this._internalScale/this.background.scale.x);

    this.__displayUI();
  }

  getConfig(){
    return {
      skin: this.__getSkinByIndex(this._skinID).id,
      costume: this.__getCostumeByIndex(this._costumeID).id
    };
  }

  isSecretSkin(id:string) : boolean {
    let secret = false;
    for(let i = 0; i < this.game.skins.skins.length; i++){
      if(this.game.skins.skins[i].id === id && this.game.skins.skins[i].secret){
        secret = true;
      }
    }

    return secret;
  }

  isSecretCostume(id:string) : boolean {
    let secret = false;
    for(let i = 0; i < this.game.skins.costumes.length; i++){
      if(this.game.skins.costumes[i].id === id && this.game.skins.costumes[i].secret){
        secret = true;
      }
    }

    return secret;
  }

  private __loadData(){
    this._mode = MODE.SKIN;
    let skinIndex:number = this.__getSkinIndex(this.game.user.skinID);
    let costumeIndex:number = this.__getCostumeIndex(this.game.user.costumeID);
    this.__setSkin(skinIndex !== -1 ? skinIndex : 0);
    this.__setCostume(skinIndex !== -1 ? costumeIndex : 0);
  }

  private __getSkinIndex(id:string):number {
    let index:number = -1;
    for(let i=0; i < this.game.skins.skins.length; i++){
      if(id === this.game.skins.skins[i].id){
        index = i;
        break;
      }
    }
    return index;
  }

  private __getCostumeIndex(id:string):number {
    let index:number = -1;
    for(let i=0; i < this.game.skins.costumes.length; i++){
      if(id === this.game.skins.costumes[i].id){
        index = i;
        break;
      }
    }
    return index;
  }

  private __setSkin(id:number = 0){
    this._skinID = id;
    if(this._skinID < 0){
      this._skinID = this.game.skins.skins.length-1;
    }else if(this._skinID >= this.game.skins.skins.length){
      this._skinID = 0;
    }
  }

  private __setCostume(id:number = 0){
    this._costumeID = id;
    if(this._costumeID < 0){
      this._costumeID = this.game.skins.costumes.length-1;
    }else if(this._costumeID >= this.game.skins.costumes.length){
      this._costumeID = 0;
    }
  }

  private __displayUI(){
    if(!this._btnBackward){
      this._btnBackward = this.__generateArrow(this.__backward);
      this._btnBackward.anchor.set(1, 0.5);
      this._btnBackward.scale.set(1);
      this._btnBackward.scale.x = -1;
      this.ui.addChild(this._btnBackward);
    }

    this._btnBackward.position.set(
      - ((this._renderer.width/2-30)/this.ui.scale.x),
      0
    );

    if(!this._btnForward){
      this._btnForward = this.__generateArrow(this.__forward);
      this._btnForward.anchor.set(1, 0.5);
      this._btnForward.scale.set(1);
      this.ui.addChild(this._btnForward);
    }

    this._btnForward.position.set(
      ((this._renderer.width/2-30)/this.ui.scale.x),
      0
    );

    if(!this._btnSkins){
      this._btnSkins = this.__generateButton(this.__goToSkins);
      this._btnSkins.anchor.set(0.5);
      this._btnSkins.scale.set(1);
      this.ui.addChild(this._btnSkins);

      let skinText:PIXI.Text = new PIXI.Text("Skins", {
        font: "16px Ubuntu",
        stroke: "#000000",
        fill: 0xa0f0f0,
        strokeThickness: 6
      });
      skinText.resolution = 2;
      skinText.position.set(0,-2);
      skinText.anchor.set(0.5);
      this._btnSkins.addChild(skinText);
    }

    this._btnSkins.position.set(
      -this._btnSkins.width/2 - 20,
      - ((this._renderer.height/2)/this.ui.scale.y - 25 - this._btnSkins.height/2)
    );

    if(!this._btnCostumes){
      this._btnCostumes = this.__generateButton(this.__goToCostumes);
      this._btnCostumes.anchor.set(0.5);
      this._btnCostumes.scale.set(1);
      this.ui.addChild(this._btnCostumes);

      let costumeText:PIXI.Text = new PIXI.Text("Costumes", {
        font: "16px Ubuntu",
        stroke: "#000000",
        fill: 0xa0f0f0,
        strokeThickness: 6
      });
      costumeText.resolution = 2;
      costumeText.position.set(0,-2);
      costumeText.anchor.set(0.5);
      this._btnCostumes.addChild(costumeText);
    }

    this._btnCostumes.position.set(
      this._btnCostumes.width/2 + 20,
      - ((this._renderer.height/2)/this.ui.scale.y - 25 - this._btnCostumes.height/2)
    );

    if(!this._btnExit){
      this._btnExit = this.__generateButton(this.__closeSkinSelector);
      this._btnExit.anchor.set(0.5, 1);
      this.ui.addChild(this._btnExit);

      let saveText:PIXI.Text = new PIXI.Text("Exit", {
        font: "16px Ubuntu",
        stroke: "#000000",
        fill: 0xa0f0f0,
        strokeThickness: 6
      });
      saveText.resolution = 2;
      saveText.anchor.set(0.5);
      saveText.position.set(
        0, -this._btnExit.height/2-3);
      this._btnExit.scale.set(0.8);
      this._btnExit.addChild(saveText);
    }

    this._btnExit.position.set(
      0,
      ((this._renderer.height/2)/this.ui.scale.y - 15)
    );

    if(!this._adBlockWarningSkin){
      this._adBlockWarningSkin = new PIXI.Text(" Disable adblock to Unlock this Skin", {
        font: "20px Ubuntu",
        stroke: "#000000",
        fill: 0xffbf3e,
        strokeThickness: 6
      });

      this._adBlockWarningSkin.resolution = 2;
      this._adBlockWarningSkin.anchor.set(0.5);
      this._adBlockWarningSkin.position.set(
        0,
        ((this._renderer.height/2)/this.ui.scale.y - 90) - this._adBlockWarningSkin.height
      );
      this.ui.addChild(this._adBlockWarningSkin);
      this._adBlockWarningSkin.visible = false;

      let tweenSkin:PIXI.tween.Tween = this.tweenManager.createTween(this._adBlockWarningSkin);
      tweenSkin.from({
        alpha: 1
      });
      tweenSkin.to({
        alpha: 0
      });
      tweenSkin.time = 2000;
      tweenSkin.delay = 500;
      tweenSkin.pingPong = true;
      tweenSkin.loop = true;
      tweenSkin.start();
    }

    if(!this._adBlockWarningCostume){
      this._adBlockWarningCostume = new PIXI.Text(" Disable adblock to Unlock this Costume", {
        font: "20px Ubuntu",
        stroke: "#000000",
        fill: 0xff625b,
        strokeThickness: 6
      });

      this._adBlockWarningCostume.resolution = 2;
      this._adBlockWarningCostume.anchor.set(0.5);
      this._adBlockWarningCostume.position.set(
        0,
        ((this._renderer.height/2)/this.ui.scale.y - 50) - this._adBlockWarningCostume.height
      );
      this.ui.addChild(this._adBlockWarningCostume);
      this._adBlockWarningCostume.visible = false;

      let tweenSkin:PIXI.tween.Tween = this.tweenManager.createTween(this._adBlockWarningCostume);
      tweenSkin.from({
        alpha: 1
      });
      tweenSkin.to({
        alpha: 0
      });
      tweenSkin.time = 2000;
      tweenSkin.pingPong = true;
      tweenSkin.loop = true;
      tweenSkin.start();
    }

    if(!this._btnBuy){
      this._btnBuy = this.__generateButton(this.__saveSkin);
      this._btnBuy.anchor.set(0.5,1);
      this.ui.addChild(this._btnBuy);

      this._textBuy = new PIXI.Text("Select", {
        font: "35px Ubuntu",
        stroke: "#000000",
        fill: 0xffffff,
        strokeThickness: 8
      });
      this._textBuy.anchor.set(0.5);
      this._textBuy.position.set(0, -3-this._btnBuy.height/2);
      this._btnBuy.scale.set(0.6);
      this._btnBuy.addChild(this._textBuy);
    }

    this._btnBuy.position.set(
      0,
      ((this._renderer.height/2)/this.ui.scale.y - 30) - this._btnBuy.height
    );

    this._btnBuy.visible = false; //todo visible if the shop is available
  }

  private __generateButton(cb:()=>void){
    let btn:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["general"].textures["btn.png"]);
    btn.interactive = true;
    setActive(btn, false);

    let up:boolean = true;

    let onUp:()=>void = ()=>{
      if(up)return;
      btn.tint = isActiveBtn(btn) ? enableColor : btnColor;
      up = true;
    };

    btn.on('mouseover', ()=>{
      if(up){
        btn.tint = isActiveBtn(btn) ? enableOverColor : btnOverColor;
      }
    });
    btn.on('mouseout', ()=>{
      if(up){
        btn.tint = isActiveBtn(btn) ? enableColor : btnColor;
      }
    });
    btn.on('mousedown', ()=>{
      if(!up)return;
      up = false;
      btn.tint = isActiveBtn(btn) ? enableActiveColor : btnActiveColor;
    });

    btn.on('mouseup', onUp);
    btn.on('mouseupoutside', onUp);
    btn.on('click', cb);
    btn.on('tap', cb);
    return btn;
  }

  private __generateArrow(cb:()=>void){
    let btn:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["general"].textures["arrow.png"]);
    btn.interactive = true;

    let up:boolean = true;

    let onUp:()=>void = ()=>{
      if(up)return;
      btn.tint = 0xffffff;
      up = true;
    };

    btn.on('mouseover', ()=>{
      if(up){
        btn.tint = 0xf0f0f0;
      }
    });
    btn.on('mouseout', ()=>{
      if(up){
        btn.tint = 0xffffff;
      }
    });
    btn.on('mousedown', ()=>{
      if(!up)return;
      up = false;
      btn.tint = 0xB3CBFA;//0xB3CBCA;
    });

    btn.on('mouseup', onUp);
    btn.on('mouseupoutside', onUp);
    btn.on('click', cb);
    btn.on('tap', cb);
    return btn;
  }

  private __saveSkin = ()=>{
    //if(this._mode === MODE.SKIN){
    if(!this.__isBLockedSkin()){
      this.game.user.skinID = this.__getSkinByIndex(this._skinID).id || this.game.skins.skins[0].id;
    }
    //}

    //if(this._mode === MODE.COSTUME){
    if(!this.__isBLockedCostume()){
      this.game.user.costumeID = this.__getCostumeByIndex(this._costumeID).id || this.game.skins.costumes[0].id;
    }
    //}

    this.game.user.save();
    this.__drawBuyButton();
  };

  private __closeSkinSelector = ()=>{
    let adblock:boolean = this._adBlockWarningSkin.visible || this._adBlockWarningCostume.visible;
    this.game.closeSkinSelector(adblock);
  };

  private __isBLockedSkin() : boolean {
    if(!this.game.adBlock)return false;

    let id:string = this.__getSkinByIndex(this._skinID).id || this.game.skins.skins[0].id;
    return validSkins.indexOf(id) === -1;
  }

  private __isBLockedCostume() : boolean {
    if(!this.game.adBlock)return false;

    let id:string = this.__getCostumeByIndex(this._costumeID).id || this.game.skins.costumes[0].id;
    return validCostumes.indexOf(id) === -1;
  }

  private __backward = ()=>{
    let valid = false;
    if(this._mode === MODE.SKIN){
      while(!valid){
        this.__setSkin(this._skinID-1);
        valid = this.__isUnlockedSkin(this._skinID);
      }

      //this.__setSkin(this._skinID-1);
      this.__drawSkins();
    }else{
      while(!valid){
        this.__setCostume(this._costumeID-1);
        valid = this.__isUnlockedCostume(this._costumeID);
      }
      //this.__setCostume(this._costumeID-1);

      this.__drawCostumes();
    }

    this._adBlockWarningSkin.visible = this.__isBLockedSkin();
    this._adBlockWarningCostume.visible = this.__isBLockedCostume();
    this.__saveSkin();
  };

  private __isUnlockedSkin(id:number) {
    if(this.game.skins.skins[id] && this.game.skins.skins[id].secret){
      return this.game.user.hasSkin(this.game.skins.skins[id].id);
    }

    return true;
  }

  private __isUnlockedCostume(id:number) {
    if(this.game.skins.costumes[id] && this.game.skins.costumes[id].secret){
      return this.game.user.hasCostume(this.game.skins.costumes[id].id);
    }

    return true;
  }

  private __forward = ()=>{
    let valid = false;
    if(this._mode === MODE.SKIN){
      while(!valid){
        this.__setSkin(this._skinID+1);
        valid = this.__isUnlockedSkin(this._skinID);
      }
      //this.__setSkin(this._skinID+1);
      this.__drawSkins();
    }else{
      while(!valid){
        this.__setCostume(this._costumeID+1);
        valid = this.__isUnlockedCostume(this._costumeID);
      }

      //this.__setCostume(this._costumeID+1);
      this.__drawCostumes();
    }

    this._adBlockWarningSkin.visible = this.__isBLockedSkin();
    this._adBlockWarningCostume.visible = this.__isBLockedCostume();
    this.__saveSkin();
  };

  private __toggleMode = ()=>{
    this._mode = this._mode === MODE.SKIN ? MODE.COSTUME : MODE.SKIN;
    if(this._mode === MODE.SKIN){
      this.__drawSkins();
      //track('skinSelector', 'mode', 'skins');
    }else{
      this.__drawCostumes();
      //track('skinSelector', 'mode', 'costumes');
    }
  };

  private __goToSkins = ()=>{
    if(this._mode === MODE.SKIN)return;
    this.__toggleMode();
  };

  private __goToCostumes = ()=>{
    if(this._mode === MODE.COSTUME)return;
    this.__toggleMode();
  };

  private __drawBuyButton(){
    setActive(this._btnBuy, false);
    this._btnBuy.tint = 0xffffff;
    this._btnBuy.interactive = true;
    let skin:skinConfig = this.__getSkinByIndex(this._skinID);
    let costume:costumeConfig = this.__getCostumeByIndex(this._costumeID);

    if(this._mode === MODE.SKIN){
      if(skin && skin.id === this.game.user.skinID){
        setActive(this._btnBuy);
        this._textBuy.text = "Selected";
        this._btnBuy.tint = enableColor;
        this._textBuy.tint = 0xffcc00;
      }else if(skin && (!skin.value || skin.value < this.game.user.beans)){
        this._textBuy.text = "Select";
        this._textBuy.tint = 0xc0c0c0;
      }else if(skin && skin.value > this.game.user.beans){
        this._textBuy.text = "Soon...";
        this._btnBuy.interactive = false;
        this._textBuy.tint = 0xc3671b;
        this._btnBuy.tint = 0xa1a1a1;
      }
    }

    if(this._mode === MODE.COSTUME){
      if(costume && costume.id === this.game.user.costumeID){
        setActive(this._btnBuy);
        this._textBuy.text = "Selected";
        this._btnBuy.tint = enableColor;
        this._textBuy.tint = 0xffcc00;
      }else if(costume && (!costume.value || costume.value < this.game.user.beans)){
        this._textBuy.text = "Select";
        this._textBuy.tint = 0xc0c0c0;
      }else if(costume && costume.value > this.game.user.beans){
        this._textBuy.text = "Soon...";
        this._btnBuy.interactive = false;
        this._textBuy.tint = 0xc3671b;
        this._btnBuy.tint = 0xa1a1a1;
      }
    }
  }

  private __getSkinByIndex(n:number):skinConfig {
    return this.game.skins.skins[n];
  }

  private __getCostumeByIndex(n:number):costumeConfig {
    return this.game.skins.costumes[n];
  }

  private __drawSkins = ()=>{
    setActive(this._btnSkins, true);
    this._btnSkins.tint = enableColor;
    setActive(this._btnCostumes, false);
    this._btnCostumes.tint = btnColor;

    if(!this._skin){
      this._skin = new DisplaySkin(this.game);
      this.ui.addChildAt(this._skin, 0);
      (window as any).skin = this._skin;
    }

    this._config = {
      skin: this.game.skins.skins[this._skinID] as skinConfig,
      costume: this.game.skins.costumes[this._costumeID] as costumeConfig
    };

    this._skin.drawConfig(this._config);
    //this._skin.tint = 0xffffff;

    this.__drawBuyButton();

    if(this.background)this.background.tint = 0xffffff;
  };

  private __drawCostumes = ()=>{
    setActive(this._btnSkins, false);
    this._btnSkins.tint = btnColor;
    setActive(this._btnCostumes, true);
    this._btnCostumes.tint = enableColor;

    if(!this._skin){
      this._skin = new DisplaySkin(this.game);
      this.ui.addChildAt(this._skin, 0);
    }

    this._config = {
      skin: this.game.skins.skins[this._skinID] as skinConfig,
      costume: this.game.skins.costumes[this._costumeID] as costumeConfig
    };

    this._skin.drawConfig(this._config);
    //this._skin.tint = 0xD4C8F6;

    this.__drawBuyButton();

    if(this.background)this.background.tint = 0xf0f0f0;
  };

}

function isActiveBtn(btn:PIXI.Sprite) : boolean {
  return (btn as any)._isActive;
}

function setActive(btn:PIXI.Sprite, value:boolean = true) {
  (btn as any)._isActive = value;
}