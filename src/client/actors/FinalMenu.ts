/**
 * Created by nazarigonzalez on 27/12/16.
 */

import MainScene from "../scenes/MainScene";
import {DEATH_BY, skinConfig, costumeConfig} from "../../common/interfaces";
import * as moment from 'moment';
import * as mdf from 'moment-duration-format';
import DisplaySkin from "./DisplaySkin";
import {isApp} from "../helpers/device";
import config from "../config.ts";

let deadCodeMoment = mdf;

const titleMessages = [
  "Worst ass EVER.",
  "Really? Noob...",
  "Something stinks...",
  "So bad...",
  "Meh...",
  "You can do it better.",
  "This was your best shot?",
  "Ok, ok, this is something...",
  "Nice!",
  "So cool!",
  "You rock!",
  "You're a real BADASS!",
  "You're fucking AWESOME!",
  "You're the BIG ASS here!"
  ];

const borderTextColor:string = "#c0c0c0";
const fillTextColor:string = "#0068ff";

export default class FinalMenu extends PIXI.Sprite {
  private _graphics:PIXI.Graphics;
  private _tweenScale:PIXI.tween.Tween;
  private _sizeWidth:number = 400;
  private _sizeHeight:number = 300;
  private _titleText:PIXI.Text;
  private _subTitleText:PIXI.Text;
  private _pointsText:PIXI.Text;
  private _gameTimeText:PIXI.Text;
  private _topTimeText:PIXI.Text;
  private _maxMassText:PIXI.Text;
  private _maxTopText:PIXI.Text;
  private _closeButton:PIXI.Sprite;
  private _maxTopTween:PIXI.tween.Tween;
  private _maxMassTween:PIXI.tween.Tween;
  private _gameTimeTween:PIXI.tween.Tween;
  private _topTimeTween:PIXI.tween.Tween;
  private _pointsTween:PIXI.tween.Tween;
  private _subtitleTween:PIXI.tween.Tween;
  private _btnTween:PIXI.tween.Tween;
  private _skinContainer:PIXI.Container;
  private _skinDisplay:DisplaySkin;
  private _statsContainer:PIXI.Container;
  private _appScale:number;


  constructor(private _scene:MainScene){
    super(null);
    this.visible = false;

    this._appScale = isApp ? (((this._sizeHeight*config.game.size)/512)/config.game.size)*1.2 : 1;

    this._statsContainer = new PIXI.Container();
    this.addChild(this._statsContainer);

    this._tweenScale = this._scene.tweenManager.createTween(this);

    this._closeButton = this.getCloseButton("Ok!");
    this._closeButton.position.set(
      0,
      this._sizeHeight/2 + 10
    );
    this._closeButton.interactive = true;
    this._closeButton.on('click', this.__onClickButton);
    this._closeButton.on('tap', this.__onClickButton);
    this._statsContainer.addChild(this._closeButton);

    this._btnTween = this._scene.tweenManager.createTween(this._closeButton);

    this.setTitle("", -1);
    this.setPoints(0);
    this.setSubTitle("");
    this.setGameTime(0);
    this.setTopTime(0);
    this.setMaxMass(0);
    this.setMaxTop(0);

    this._skinContainer = new PIXI.Container();
    this.addChild(this._skinContainer);

    let light = new PIXI.Sprite(PIXI.loader.resources["general"].textures["fan.png"]);
    light.anchor.set(0.5);
    light.scale.set(4);
    //light.blendMode = PIXI.BLEND_MODES.ADD;
    light.alpha = 0.5;
    light.update = function(delta:number){
      light.rotation += 1*delta;
    };

    this._skinContainer.addChild(light);

    let unlockText = new PIXI.Text("Skin Unlocked!", {
      fill: "#ff9bf2",
      font: "40px Ubuntu",
      stroke: "#909090",
      strokeThickness: 5
    });
    unlockText.resolution = 2;
    unlockText.anchor.set(0.5, 1);
    unlockText.position.set(0, -this._sizeHeight/2);
    this._skinContainer.addChild(unlockText);

    this._skinDisplay = new DisplaySkin(this._scene.game);
    this._skinDisplay.interactive = true;
    this._skinDisplay.drawConfig({
      skin: this._scene.game.skins.skins[0] as skinConfig,
      costume: this._scene.game.skins.costumes[0] as costumeConfig
    });
    this._skinContainer.addChild(this._skinDisplay);

    if(isApp){
      this._statsContainer.scale.set(this._appScale);
      this._skinContainer.scale.set(this._appScale);
    }
  }

  onCloseClick(){}

  getCloseButton(text:string):PIXI.Sprite {
    let btn:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["general"].textures["btn.png"]);
    btn.anchor.set(0.5);
    //btn.tint = 0x63ca83;
    btn.tint = 0x50afff;
    btn.scale.set(1.2);
    //btn.scale.set(0.5);

    let txt:PIXI.Text = new PIXI.Text(text, {
      fill: 0xffffff,
      font: "25px Ubuntu",
      stroke: "#000000",
      strokeThickness: 4
    });
    txt.resolution = 2;
    txt.anchor.set(0.5);
    btn.addChild(txt);

    return btn;
  }

  setPoints(n:number) {
    if(!this._pointsText){
      let pointsTitle:PIXI.Text = this.__getSecondaryText(" Points");
      pointsTitle.anchor.set(0.5, 1);
      pointsTitle.position.set(
        0,
        20
      );
      this._statsContainer.addChild(pointsTitle);

      this._pointsText = new PIXI.Text("0", {
        fill: 0xffcd4c,
        font: "100px Ubuntu",
        stroke: "#ee363f",
        //stroke: "#ee9147",
        strokeThickness: 10
      });
      this._pointsText.resolution = 2;
      this._pointsText.anchor.set(0.5, 0);
      this._statsContainer.addChild(this._pointsText);

      (this._pointsText as any)._points = 0;
      this._pointsText.update = function(delta:number){
        if(this.text != (this as any)._points){
          this.text = Math.floor((this as any)._points).toString();
        }
      };

      this._pointsTween = this._scene.tweenManager.createTween(this._pointsText);
    }

    (this._pointsText as any)._points = 0;
    this._pointsText.text = "0";
    this._pointsText.position.set(
      0,
      0
    );

    this._pointsTween.stop();
    this._pointsTween.reset();
    this._pointsTween.delay = 2400;
    this._pointsTween.time = 1200;
    this._pointsTween.easing = PIXI.tween.Easing.outCirc();
    this._pointsTween.from({
      _points: 0
    });
    this._pointsTween.to({
      _points: n
    });
    this._pointsTween.start();
  }

  setTitle(text:string, type:number) {
    if(!this._titleText){
      this._titleText = new PIXI.Text(text, {
        fill: 0xffffff,
        font: "40px Ubuntu",
        stroke: "#909090",
        strokeThickness: 5
      });
      this._titleText.resolution = 2;
      this._titleText.anchor.set(0.5, 1);
      this._statsContainer.addChild(this._titleText);
    }

    if(type === DEATH_BY.PLAYER){
      this._titleText.style.stroke = "#ffffff";
      this._titleText.style.fill = "#ff1000";
    } else if(type === DEATH_BY.OUT){
      this._titleText.style.fill = "#ff7d5b";
      this._titleText.style.stroke = "#ffffff";
    }else {
      this._titleText.style.fill = "#ffffff";
      this._titleText.style.stroke = "#909090";
    }

    this._titleText.text = text;
    this._titleText.position.set(
      0,
      -this._sizeHeight/2 - this._titleText.height + 5
    );
  }

  setSubTitle(text:string) {
    if(!this._subTitleText){
      this._subTitleText = new PIXI.Text(text, {
        fill: "#000000",
        font: "20px Ubuntu",
        stroke: "#85bdff",
        strokeThickness: 3
      });
      this._subTitleText.resolution = 2;
      this._subTitleText.anchor.set(0.5);
      this._statsContainer.addChild(this._subTitleText);

      this._subtitleTween = this._scene.tweenManager.createTween(this._subTitleText);
    }

    this._subTitleText.text = text;
    this._subTitleText.position.set(
      0,
      125
    );

    this._subTitleText.alpha = 0;
    this._subtitleTween.stop();
    this._subtitleTween.reset();
    this._subtitleTween.delay = 3000;
    this._subtitleTween.time = 500;
    //this._subtitleTween.easing = PIXI.tween.Easing.outCirc();
    this._subtitleTween.from({
      alpha: 0
    });
    this._subtitleTween.to({
      alpha: 1
    });
    this._subtitleTween.start();

    this._closeButton.scale.set(0);
    this._closeButton.interactive = false;
    this._btnTween.stop();
    this._btnTween.reset();
    this._btnTween.delay = 3200;
    this._btnTween.time = 700;
    this._btnTween.easing = PIXI.tween.Easing.outBack();
    this._subtitleTween.from({
      scale: {
        x: 0,
        y: 0
      }
    });
    this._btnTween.to({
      scale: {
        x: 1, y: 1
      }
    });
    this._btnTween.start();
    this._btnTween.once("end", ()=>{
      this._closeButton.interactive = true;
    });
  }

  setMaxTop(n:number) {
    if(!this._maxTopText){
      let maxTopTitle = this.__getSecondaryText(" Best Position");
      maxTopTitle.anchor.set(0.5);
      maxTopTitle.position.set(
        -this._sizeWidth/3,
        -this._sizeHeight/2 - 15
      );
      this._statsContainer.addChild(maxTopTitle);

      this._maxTopText = new PIXI.Text(n.toString(), {
        fill: fillTextColor,
        font: "40px Ubuntu",
        stroke: borderTextColor,
        strokeThickness: 4
      });
      this._maxTopText.resolution = 2;
      this._maxTopText.anchor.set(0.5, 0);
      this._statsContainer.addChild(this._maxTopText);

      this._maxTopTween = this._scene.tweenManager.createTween(this._maxTopText);
    }

    this._maxTopText.text = n.toString();
    this._maxTopText.position.set(
      -this._sizeWidth/3,
      -this._sizeHeight/2+8-15
    );

    this._maxTopText.alpha = 0;
    this._maxTopTween.stop();
    this._maxTopTween.reset();
    this._maxTopTween.delay = 1000;
    this._maxTopTween.time = 700;
    //this._subtitleTween.easing = PIXI.tween.Easing.outCirc();
    this._maxTopTween.from({
      alpha: 0
    });
    this._maxTopTween.to({
      alpha: 1
    });
    this._maxTopTween.start();
  }

  setMaxMass(n:number) {
    if(!this._maxMassText){
      let maxMassTitle = this.__getSecondaryText(" Max Mass");
      maxMassTitle.anchor.set(0.5);
      maxMassTitle.position.set(
        this._sizeWidth/3,
        -this._sizeHeight/2-15
      );
      this._statsContainer.addChild(maxMassTitle);

      this._maxMassText = new PIXI.Text(n.toString(), {
        fill: fillTextColor,
        font: "40px Ubuntu",
        stroke: borderTextColor,
        strokeThickness: 4
      });
      this._maxMassText.resolution = 2;
      this._maxMassText.anchor.set(0.5, 0);
      this._statsContainer.addChild(this._maxMassText);

      this._maxMassTween = this._scene.tweenManager.createTween(this._maxMassText);
    }

    this._maxMassText.text = n.toString();
    this._maxMassText.position.set(
      this._sizeWidth/3,
      -this._sizeHeight/2+8-15
    );

    this._maxMassText.alpha = 0;
    this._maxMassTween.stop();
    this._maxMassTween.reset();
    this._maxMassTween.delay = 1200;
    this._maxMassTween.time = 700;
    //this._subtitleTween.easing = PIXI.tween.Easing.outCirc();
    this._maxMassTween.from({
      alpha: 0
    });
    this._maxMassTween.to({
      alpha: 1
    });
    this._maxMassTween.start();
  }

  setGameTime(n:number) {
    let duration:string = (moment.duration(n, 'seconds') as any).format("m:ss");
    duration += (n < 60) ? "s" : "m";

    if(!this._gameTimeText){
      let gameTimeTitle = this.__getSecondaryText(" Game Time");
      gameTimeTitle.anchor.set(0.5);
      gameTimeTitle.position.set(
        -this._sizeWidth/3,
        -60-15
      );
      this._statsContainer.addChild(gameTimeTitle);

      this._gameTimeText = new PIXI.Text(duration, {
        fill: fillTextColor,
        font: "40px Ubuntu",
        stroke: borderTextColor,
        strokeThickness: 4
      });
      this._gameTimeText.resolution = 2;
      this._gameTimeText.anchor.set(0.5, 0);
      this._statsContainer.addChild(this._gameTimeText);

      this._gameTimeTween = this._scene.tweenManager.createTween(this._gameTimeText);

    }

    this._gameTimeText.text = duration;
    this._gameTimeText.position.set(
      -this._sizeWidth/3,
      -60+8-15
    );

    this._gameTimeText.alpha = 0;
    this._gameTimeTween.stop();
    this._gameTimeTween.reset();
    this._gameTimeTween.delay = 1400;
    this._gameTimeTween.time = 700;
    //this._subtitleTween.easing = PIXI.tween.Easing.outCirc();
    this._gameTimeTween.from({
      alpha: 0
    });
    this._gameTimeTween.to({
      alpha: 1
    });
    this._gameTimeTween.start();
  }


  setTopTime(n:number) {
    let duration:string = (moment.duration(n, 'seconds') as any).format("m:ss");
    duration += (n < 60) ? "s" : "m";

    if(!this._topTimeText){
      let topTimeTitle = this.__getSecondaryText(" Time at #1");
      topTimeTitle.anchor.set(0.5);
      topTimeTitle.position.set(
        this._sizeWidth/3,
        -60-15
      );
      this._statsContainer.addChild(topTimeTitle);

      this._topTimeText = new PIXI.Text(duration, {
        fill: fillTextColor,
        font: "40px Ubuntu",
        stroke: borderTextColor,
        strokeThickness: 4
      });
      this._topTimeText.resolution = 2;
      this._topTimeText.anchor.set(0.5, 0);
      this._statsContainer.addChild(this._topTimeText);

      this._topTimeTween = this._scene.tweenManager.createTween(this._topTimeText);

    }

    this._topTimeText.text = duration;
    this._topTimeText.position.set(
      this._sizeWidth/3,
      -60+8-15
    );

    this._topTimeText.alpha = 0;
    this._topTimeTween.stop();
    this._topTimeTween.reset();
    this._topTimeTween.delay = 1600;
    this._topTimeTween.time = 700;
    //this._subtitleTween.easing = PIXI.tween.Easing.outCirc();
    this._topTimeTween.from({
      alpha: 0
    });
    this._topTimeTween.to({
      alpha: 1
    });
    this._topTimeTween.start();
  }

  setData(data:any){
    if(this.displayUnlockedSkin(data)){
      this._skinContainer.visible = true;
      this._statsContainer.visible = false;
      return;
    }

    this._skinContainer.visible = false;
    this._statsContainer.visible = true;

    this.setPoints(data.points);
    this.setSubTitle(this.__getSubtitle(data.points));
    switch(data.deathType){
      case DEATH_BY.OUT:
        this.setTitle("You committed suicide!", DEATH_BY.OUT);
        break;
      case DEATH_BY.PLAYER:
        this.setTitle(`${data.killer} killed you!`, DEATH_BY.PLAYER);
        break;
      case DEATH_BY.MEDICINE:
        this.setTitle(`Give yourself to the Dark Side`, DEATH_BY.MEDICINE);
        break;
    }
    this.setMaxTop(data.top);
    this.setMaxMass(data.mass);
    this.setGameTime(data.gameTime);
    this.setTopTime(data.topTime);
  }

  open(cb?:()=>void){
    this.scale.y = 0;
    this._tweenScale.stop();
    this._tweenScale.reset();
    this._tweenScale.removeAllListeners('end');
    this._tweenScale.easing = PIXI.tween.Easing.inOutExpo();
    this._tweenScale.time = 1000;
    this._tweenScale.from({
      scale: {y: 0}
    });
    this._tweenScale.to({
      scale: {y:1}
    });
    this._tweenScale.start();
    this.visible = true;

    if(cb){
      this._tweenScale.once('end', cb);
    }

    //this.setSubTitle(titleMessages[Math.floor(titleMessages.length*Math.random())]);
  }

  close(cb?:()=>void){
    this.scale.y = 1;
    this._tweenScale.stop();
    this._tweenScale.reset();
    this._tweenScale.removeAllListeners('end');
    this._tweenScale.easing = PIXI.tween.Easing.inOutExpo();
    this._tweenScale.time = 500;
    this._tweenScale.from({
      scale: {y: 1}
    });
    this._tweenScale.to({
      scale: {y:0}
    });
    this._tweenScale.start();

    if(cb){
      this._tweenScale.once('end', ()=>{
        this.visible = false;
        cb();
      });
    }
  }

  displayUnlockedSkin(data:any) : boolean {
    let skin:string[] = [];
    let skinData = localStorage.getItem("lastSkin");
    if(skinData){
      try {
        skin = JSON.parse(skinData);
      } catch(e) {
        console.error('Invalid last skin');
      }
    }

    localStorage.removeItem("lastSkin");

    if(skin.length){
      let valid = false;
      if(this._scene.game.isSkinToUnlock(skin[0])){
        this._scene.game.user.unlockSkin(skin[0]);
        valid = true;
      }else if(this._scene.game.isCostumeToUnlock(skin[1])){
        this._scene.game.user.unlockCostume(skin[1]);
        valid = true;
      }

      if(valid){
        this._skinDisplay.drawConfig({
          skin: this._scene.game.getSkinByID(skin[0]),
          costume: this._scene.game.getCostumeByID(skin[1])
        });

        this._skinDisplay.removeAllListeners("tap");
        this._skinDisplay.removeAllListeners("click");
        this._skinDisplay.once("tap", this.setData.bind(this, data));
        this._skinDisplay.once("click", this.setData.bind(this, data));
        return true;
      }
    }

    return false;
  }

  private __getSubtitle(points:number):string {
    let len:number = titleMessages.length;
    let titleIndex:number = Math.ceil((points*len)/100)-1;
    if(titleIndex < 0)titleIndex = 0;
    return titleMessages[titleIndex];
  }

  private __getSecondaryText(text:string):PIXI.Text {
    let secondaryText:PIXI.Text = new PIXI.Text(text, {
      stroke: "#ffffff",
      font: "20px Ubuntu",
      fill: "#c0c0c0",
      //stroke: "#ee9147",
      strokeThickness: 4
    });

    secondaryText.resolution = 2;
    return secondaryText;
  }

  private __onClickButton = (evt:any)=>{
    this.onCloseClick();
  }
}