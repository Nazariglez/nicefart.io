import LoaderScene from './scenes/LoaderScene';
import NetworkModel from './NetworkModelAdapter';
import GameScene from "./scenes/GameScene";
import {GameWorldState, skinsInfo, customSkinConfig, skinConfig, costumeConfig} from "../common/interfaces";
import AbstractScene from "./scenes/AbstractScene";
import SkinSelectorScene from "./scenes/SkinSelectorScene";
import {ActorRemoveConfig, ActorHelper} from "./helpers/ActorHelper";
import RendererOptions = PIXI.RendererOptions;
import MainScene from "./scenes/MainScene";
import {track} from "./helpers/track";
import ErrorBox from "./ErrorBox";
import Accelerometer from "./helpers/Accelerometer";
import * as device from "./helpers/device";
import {isAndroid, isMobile, isTablet, isTouchDevice} from "./helpers/device";
import {updateParticles} from "./actors/Particle";
import User from "./helpers/User";
import {canDisplayAds} from "./helpers/device";
import {isCocoon} from "./helpers/device";
import NetworkModelAdapter from "./NetworkModelAdapter";
import {logo as tarentolaLogo} from "./tarentola";
import {isApp} from "./helpers/device";
import adsManager from './helpers/AdsManager';

declare const cordova:any;

enum STATES {
  LOADING, MAIN, PLAYING, ERROR, INFO
}

let fadeIntervalRef:any;

declare const ga:any;
declare const adsbygoogle:any;
declare const Keyboard:any;

export default class Game {
  private _model:NetworkModel;
  private _state:STATES = STATES.LOADING;
  private _skinSelectorScene:SkinSelectorScene;
  private _gameScene:GameScene;
  private _loaderScene:LoaderScene;
  private _lastUpdateTime:number = 0;
  private _removeData:ActorRemoveConfig[] = [];
  private _mainScene:MainScene;
  private _loadTimeTrack:number;
  private _errorBox:ErrorBox = new ErrorBox();
  private _cookieAlert:any;
  private _cookieAlertLink:any;
  private _fartSong:PIXI.audio.Audio;
  private _fartSongVolume:PIXI.tween.Tween;

  user:User;
  skins:skinsInfo;
  accel:Accelerometer;
  adBlock:boolean = false;

  renderer:PIXI.WebGLRenderer|PIXI.CanvasRenderer;
  animationLoop:PIXI.AnimationLoop;

  constructor(private _version:string, config:any){
    localStorage.setItem("s", "");
    const Renderer:any = (config.webgl) ? PIXI.autoDetectRenderer : PIXI.CanvasRenderer;
    if(isCocoon){
      this.renderer = new PIXI.WebGLRenderer(config.width || 800, config.height || 600, config.rendererOptions);
    }else{
      this.renderer = new Renderer(config.width || 800, config.height || 600, config.rendererOptions);
    }
    document.body.appendChild(this.renderer.view);

    this.animationLoop = new PIXI.AnimationLoop(this.renderer);
    this.animationLoop.stopOnVisibilityChange = true;
    this.animationLoop.on('prerender', this.update.bind(this));
    this.animationLoop.on('postrender', this._updateManagers.bind(this));

    this._model = new NetworkModel();
    this._model.getWorldUpdate = this.__getWorldUpdate;
    this._model.onCloseTime = this.__onCloseTime;
    this._model.updateLeaderboard = this.__onUpdateLeaderboard;
    this._model.updateRadar = this.__onUpdateRadar;
    window.addEventListener("resize", this.__onResize);
    this.renderer.view.addEventListener("contextmenu", (evt:MSGestureEvent)=>evt.preventDefault());
    window.document.querySelector("*").addEventListener("contextmenu", (evt:MSGestureEvent)=>evt.preventDefault());

    if((isMobile || isTablet) && isTouchDevice){
      this.accel = new Accelerometer();
      this.accel.enable();
    }

    if(!isApp){
      this._cookieAlert = document.querySelector("div#cookie-alert") as any;
      this._cookieAlertLink = document.querySelector("a.close-cookie") as any;
      let logo = document.querySelector("img#tarentola-logo") as any;
      logo.src = tarentolaLogo;
    }

    if(isApp){
      let iframe = document.querySelector("div#ranking") as HTMLDivElement;
      let closeLeaderboard = document.querySelector("a#close-ranking");
      let leaderboardBtn = document.querySelector("a#leaderboard");

      if(leaderboardBtn && iframe){
        leaderboardBtn.addEventListener("click", function(evt){
          evt.preventDefault();
          let frame = iframe.querySelector("iframe") as HTMLFrameElement;
          frame.src = "leaderboard.html";
          iframe.style.display = "block";
        });
      }

      if(closeLeaderboard&&iframe){
        closeLeaderboard.addEventListener("click", function(evt){
          evt.preventDefault();
          iframe.style.display = "none";
          let frame = iframe.querySelector("iframe") as HTMLFrameElement;
          frame.src = "";
        });
      }
    }
    (window as any).game = this; //todo remove this

    //(window as any).NoADS = true;
    if(window.location.hash === "#youtuber"){
      (window as any).NoADS = true;
      this.__removeHash();
      console.log("Ads Disabled...");
    }else if(window.location.hash === "#ads"){
      (window as any).NoADS = false;
    }

    adsManager.init();
  }

  initialize():void{
    this._loadTimeTrack = Date.now();
    this._loaderScene = new LoaderScene(this);
    this._loaderScene.load(this.__onLoad);
    this.stage = this._loaderScene;
    this.start();

    this.user = new User(this);
    this.__setName(this.user.name);
    this.__getSkins((err:Error)=>{
      if(err){
        this.__displayError("Error loading initial config.");
        return console.error(err);
      }
      console.log('Skins loaded.');
    });


  }

  getSkinByID(id:string):skinConfig{
    let skin:skinConfig;
    for(let i = 0; i < this.skins.skins.length; i++){
      if(this.skins.skins[i].id === id){
        skin = this.skins.skins[i] as skinConfig;
        break;
      }
    }

    return skin;
  }

  getCostumeByID(id:string):costumeConfig{
    let costume:costumeConfig;
    for(let i = 0; i < this.skins.costumes.length; i++){
      if(this.skins.costumes[i].id === id){
        costume = this.skins.costumes[i] as costumeConfig;
        break;
      }
    }

    return costume;
  }

  isSkinToUnlock(id:string):boolean {
    if(!this._skinSelectorScene){
      this._skinSelectorScene = new SkinSelectorScene(this);
    }
    return (this._skinSelectorScene.isSecretSkin(id) && !this.user.hasSkin(id));
  }

  isCostumeToUnlock(id:string):boolean {
    if(!this._skinSelectorScene){
      this._skinSelectorScene = new SkinSelectorScene(this);
    }
    return (this._skinSelectorScene.isSecretCostume(id) && !this.user.hasCostume(id));
  }

  update():void{
    if(this.stage.update){
      this.stage.update(this.animationLoop.delta);
      updateParticles(this.animationLoop.delta);
    }
  }

  _updateManagers():void{
    PIXI.keyboardManager.update(); //keyboard don't need the delta time
    PIXI.tweenManager.update(this.animationLoop.delta);
  }

  start():void{
    this.animationLoop.start();
  }

  stop():void{
    this.animationLoop.stop();
  }

  closeSkinSelector(adblock:boolean){
    //track('skinSelector', 'close');
    this.stage = this._mainScene;
    this._mainScene.drawSkin();
    this.__hideAdsBlock(false);
    this.__showLogin(0, ()=>{
      //this.stage = this._gameScene;
      //this.stop();
    });

  }

  private __removeHash(){
    history.pushState("", document.title, window.location.pathname
      + window.location.search);
  }

  private __getSkins(cb:(err?:Error)=>void){
    if(!this.skins||!this.skins.skins||!this.skins.costumes){
      this._model.getSkins((data:skinsInfo)=>{
        if(data&&data.skins&&data.costumes){
          this.skins = data;

          if(!this.user.skinID){
            this.user.skinID = this.skins.skins[0].id;
          }

          if(!this.user.costumeID){
            this.user.costumeID = this.skins.costumes[0].id;
          }

          return cb();
        }else{
          return cb(new Error("Something went wrong."));
        }
      }, cb);
      return;
    }

    cb();
  }

  private __onLoad = ()=>{
    const loadTime:number = Date.now()-this._loadTimeTrack;
    //track('game', 'load', 'time', loadTime);
    console.log('ADS:', canDisplayAds());

    this._fartSong = PIXI.audioManager.getAudio("fartSong");
    this._fartSong.loop = true;
    this._fartSong.volume = 0;

    this._gameScene = new GameScene(this);

    /*let playButton:HTMLButtonElement = document.querySelector('button#play') as HTMLButtonElement;
    playButton.addEventListener('click', this.__login);*/

    PIXI.keyboardManager.on('pressed', (key:PIXI.keyboard.Key)=>{
      if(PIXI.keyboard.Key.ENTER === key && !this._mainScene.isTutorialOpen){
        if(isApp){
          Keyboard.hide();
        }else{
          this.tryLogin();
        }
      }else if(this._state === STATES.PLAYING){
        if(!isApp && PIXI.keyboard.Key.Q === key)this._gameScene.runFast(true);
        if(!isApp && PIXI.keyboard.Key.W === key)this._gameScene.fire();
        if(!isApp && PIXI.keyboard.Key.E === key)this._gameScene.pepper();
      }
    });

    PIXI.keyboardManager.on('released', (key:PIXI.keyboard.Key)=>{
      if(this._state === STATES.PLAYING){
        if(!isApp && PIXI.keyboard.Key.Q === key)this._gameScene.runFast(false);
      }
    });

    this._mainScene = new MainScene(this);
    this._mainScene.addSkinSelectorCallback(this.__displaySkinSelector);
    this.stage = this._mainScene;

    this._fartSongVolume = PIXI.tweenManager.createTween(this._fartSong);
    this.playFartSong();

    if(!isApp) {
      /*setTimeout(() => {
        if (!isMobile && !(adsbygoogle && adsbygoogle.loaded)) {
          let img = document.createElement("img");
          img.src = "/assets/img/win-placeholder.png";
          document.querySelector("div#main-win").appendChild(img);
        }
      }, 1600);

      this.__addAdsScript((loaded: boolean) => {
        this.adBlock = !loaded;
        console.log('ADBLOCK', this.adBlock);
      });*/
    }
  };

  firstInit(){
    this.__scaleLoginContainer();
    this.__displayCookieAlert();
    this.__showLogin(200, ()=>{
      this._state = STATES.MAIN;
      this.__bindInfoButtons();
      this.__readLocationHash();
      this.__displayShareIcons();
    });
  }

  playFartSong(){
    if(this.user.music){
      this._fartSong.volume = 0;
      if(this._fartSong.paused){
        this._fartSong.paused = false;
      }

      this._fartSong.play();
      this._fartSongVolume.stop();
      this._fartSongVolume.reset();
      this._fartSongVolume.time = 2000;
      this._fartSongVolume.from({volume: 0});
      this._fartSongVolume.to({volume:1});
      this._fartSongVolume.delay = 100;
      this._fartSongVolume.start();

    }
  }

  stopFartSong(){
    //this._fartSong.paused = true;
    this._fartSongVolume.stop();
    this._fartSongVolume.reset();
    this._fartSongVolume.time = 1500;
    this._fartSongVolume.from({volume: 1});
    this._fartSongVolume.to({volume:0});
    this._fartSongVolume.delay = 100;
    this._fartSongVolume.once("end", ()=>{
      if(this._fartSong.playing && !this._fartSong.paused){
        this._fartSong.paused = true;
      }
    });
    this._fartSongVolume.start();
  }

  toggleAudio(){
    if(this.user.music){
      this.user.music = false;
      this.user.save();
      PIXI.audioManager.pause();
    }else{
      this.user.music = true;
      this.user.save();
      if(this._state === STATES.MAIN){
        this.playFartSong();
      }else{
        PIXI.audioManager.resume();
      }
    }
  }

  private __displayCookieAlert = ()=>{
    if(isApp)return;
    if(!this.user.agree){
      this._cookieAlert.style.display = "block";
      this._cookieAlertLink.addEventListener("click", ()=>{
        this.__userAgree();
        setTimeout(()=>{
          this.__readLocationHash();
        }, 100);
      });
    }
  };

  private __userAgree = ()=>{
    if(!isApp)this._cookieAlert.style.display = "none";
    this.user.agree = true;
    this.user.save();
  };

  private __hideAdsBlock = (value:boolean)=>{
    /*if(isApp)return;
    if((document.querySelector("div#main-win") as any).style.display === "none")return;
    if(value){
      (document.querySelector("div#main-win") as any).style.marginTop = "5000px";
    }else{
      (document.querySelector("div#main-win") as any).style.marginTop = "140px";
    }*/
  };

  private __addAdsScript(cb:(loaded:boolean)=>void){
    if(isApp || true)return; //todo remove
    if(isMobile||window.innerHeight <= 500){
      let ads = document.querySelector("ins.adsbygoogle") as any;
      if(ads){
        ads.style.display = "none";
      }
      (document.querySelector("div#main-win") as any).style.display = "none";
      (document.querySelector("div.v-container") as any).style.top = 0;
      return cb(true);
    }

    (document.querySelector("div#main-win") as any).style.display = "block";
    let script = document.createElement("script");
    script.async = true;
    script.onload = function(){
      cb(true);
    };
    script.onerror = function(){
      cb(false);
    };
    script.src = "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    document.body.appendChild(script);
  }

  private __displayShareIcons = ()=>{
    /*if(isApp){
      this._mainScene.hideSkins(false);
      return;
    }
    if(!this.user.share){
      (window.document.querySelector("div#social") as HTMLDivElement).style.display = "block";
      window.document.querySelector("a#twitter-logo").addEventListener("click", ()=>{
        setTimeout(()=>{
          this.user.share = true;
          this.user.save();
          this.__displayShareIcons();
        }, 5000);
      });

      /*window.document.querySelector("a#facebook-logo").addEventListener("click", ()=>{
        setTimeout(()=>{
          this.user.share = true;
          this.user.save();
          this.__displayShareIcons();
        }, 5000);
      });*/

     /* (window.document.querySelector("div#info") as HTMLDivElement).style.display = "none";
    }else{
      (window.document.querySelector("div#social") as HTMLDivElement).style.display = "none";
      (window.document.querySelector("div#info") as HTMLDivElement).style.display = "block";
      this._mainScene.hideSkins(false);
    }

    setTimeout(()=>{
      if((window.document.querySelector("div#info") as HTMLDivElement).style.display === "none"){
        (window.document.querySelector("div#info") as HTMLDivElement).style.display = "block";
      }
    }, 20000);*/
  };

  private __displaySkinSelector = ()=>{
    if(this._state !== STATES.MAIN)return;
    this.__getSkins((err:Error)=>{
      if(err)return this.__displayError(String(err));

      if(!this._skinSelectorScene){
        this._skinSelectorScene = new SkinSelectorScene(this);
      }

      //track('skinSelector', 'open');
      this.stage = this._skinSelectorScene;
      this.start();
      this.__hideLogin(0);
      this.__hideAdsBlock(true);
    });
  };

  private __onUpdateRadar = (data:number[])=>{
    if(this._state !== STATES.PLAYING)return;
    this._gameScene.updateRadar(data);
  };

  private __onUpdateLeaderboard = (data:any[])=>{
    if(this._state !== STATES.PLAYING)return;
    this._gameScene.updateLeaderboard(data);
  };

  private __getName():string {
    return (document.querySelector('input#player-name') as HTMLInputElement).value.trim();
  }

  private __setName(name:string) {
    (document.querySelector('input#player-name') as HTMLInputElement).value = name;
  }

  private __bindInfoButtons(){
    let buttons = document.querySelectorAll("a.info") as any;
    buttons.forEach((btn:any)=>btn.addEventListener("click", this.__readHash.bind(this, btn.attributes.href.value)));
  }

  private __readLocationHash = ()=>{
    this.__readHash(window.location.hash);
  };

  triggerHash(hash:string){
    this.__readHash(hash);
  }

  private __readHash = (hash:string)=>{
    if(isApp)return;
    if(this._state !== STATES.MAIN && this._state !== STATES.INFO)return;

    let extraDiv:HTMLDivElement = document.querySelector("div#extra") as HTMLDivElement;
    let contactDiv:HTMLDivElement = document.querySelector("div#contact") as HTMLDivElement;
    let changelogDiv:HTMLDivElement = document.querySelector("div#changelog") as HTMLDivElement;
    let privacyDiv:HTMLDivElement = document.querySelector("div#privacy") as HTMLDivElement;
    contactDiv.style.display = "none";
    changelogDiv.style.display = "none";
    privacyDiv.style.display = "none";

    switch(hash){
      case "#contact":
        console.log('contact');
        contactDiv.style.display = "block";
        extraDiv.style.display = "block";
        this._state = STATES.INFO;
        break;
      case "#changelog":
        console.log('changlog');
        changelogDiv.style.display = "block";
        extraDiv.style.display = "block";
        this._state = STATES.INFO;
        break;
      case "#privacy":
        console.log("privacy");
        privacyDiv.style.display = "block";
        extraDiv.style.display = "block";
        this._state = STATES.INFO;
        break;
      default:
        console.log('default section');
        extraDiv.style.display = "none";
        this._state = STATES.MAIN;
        break;
    }
  };

  tryLogin = ()=>{
    if(this._state !== STATES.MAIN)return;
    let playerName:string = this.__getName();

    this.__getSkins((err:Error)=>{
      if(err)return this.__displayError(String(err));

      setTimeout(()=>{
        //if the request is slow display a spinner
        if(this._state !== STATES.MAIN)return;
        this.__showSpinner();
      }, 150);

      const skin:customSkinConfig = this.user.getSkinConfig();

      console.log('VERSION:', this._version);
      adsManager.displayinterstitial((success:boolean)=>{

        this._model.init({
          guest: true,
          name: playerName,
          version: this._version,
          server: localStorage.getItem("s"),
          skin: {skin: skin.skin.id, costume: skin.costume.id}//JSON.stringify(skin)
        }, (data:any)=>{
          if(!this.user.agree)this.__userAgree();
          this.stopFartSong();
          console.log('here');
          this.user.name = playerName;
          this.user.save();
          track('game', 'start');
          if(playerName){
            //track('game', 'name', 'added');
          }

          if(isApp){
            track('game', 'device', isAndroid ? "android" : "ios");
          }

          //track('game', 'skin', skin.skin.id);
          //track('game', 'costume', skin.costume.id);

          this.__showSpinner(false);
          this._state = STATES.PLAYING;
          this.start();
          this._gameScene.sendNetworkInput = this._model.sendInput;
          this._gameScene.initialize(data);
          this.stage = this._gameScene;
          this.__hideLogin(0);
          this.__hideAdsBlock(true);

          //TEST
          /*let i = 0;
           setInterval(()=>{
           //if(1 == 1)return;
           if(i >= 400)return;
           console.log(i);
           i++;
           let model = new NetworkModelAdapter();
           model.init({
           guest: true,
           name: "TEST_" + i,
           version: this._version,
           server: localStorage.getItem("s"),
           skin: {skin: skin.skin.id, costume: skin.costume.id}//JSON.stringify(skin)
           }, () => {
           setInterval(() => {
           model.sendInput(
           Math.random() * 360,
           10,
           Math.random() < 0.3 ? !!Math.round(Math.random()) : false,
           Math.random() < 0.2 ? !!Math.round(Math.random()) : false,
           Math.random() < 0.1 ? !!Math.round(Math.random()) : false
           );
           }, 300);
           }, console.log);
           }, 200);*/

        }, (err)=>{
          this.__showSpinner(false);
          this.__displayError(String(err));
          console.error(err);
        });

      });

    });
  };

  private __displayError(msg:string) {
    this._state = STATES.ERROR;
    if(msg && msg.indexOf("502") !== -1){
      msg = "Server down. Try again in a few minutes.";
    }
    this._errorBox.show(msg);
    this._errorBox.onClose = ()=>{
      this._state = STATES.MAIN;
      if(msg && msg.indexOf("invalid client version") !== -1){
        window.location.reload(true);
      }
    }
  }

  private __showSpinner(visible:boolean = true){
    let login:HTMLDivElement = document.querySelector("div#loader") as HTMLDivElement;
    login.style.display = visible ? "block" : "none";
  }

  private __showLogin(time:number = 200, cb?:()=>void){
    setTimeout(()=>{
      this._mainScene.hideLogin(false);
      if(cb)cb();
    }, time);
    /*let login:HTMLDivElement = document.querySelector("div#login") as HTMLDivElement;
    login.style.display = "block";
    login.style.opacity = "0";

    fadeIntervalRef = setInterval(()=>{
      let op:number = parseFloat(login.style.opacity) || 0;

      if(op >= 1){
        clearInterval(fadeIntervalRef);
        if(cb)cb();
      }
      login.style.opacity = (op+0.016).toString();
    }, time/60);*/
  }

  private __hideLogin(time:number = 200, cb?:()=>void){
    setTimeout(()=>{
      this._mainScene.hideLogin();
      if(cb)cb();
    }, time);
    /*let login:HTMLDivElement = document.querySelector("div#login") as HTMLDivElement;
    login.style.opacity = "1";

    if(time === 0){
      login.style.opacity = "0";
      login.style.display = "none";
    }else{

      fadeIntervalRef = setInterval(()=>{
        let op:number = parseFloat(login.style.opacity) || 0;

        if(op <= 0){
          clearInterval(fadeIntervalRef);
          login.style.display = "none";
          if(cb)cb();
        }
        login.style.opacity = (op-0.016).toString();
      }, time/60);
    }*/
  }

  private __onCloseTime = (data:any)=>{
    console.log('CLOSE TIME', data);
    this._gameScene.closeAnimation(data.time, ()=>{
      this.stage = this._mainScene;
      this._mainScene.onCloseFinalMenu = this.__onCloseButtonClick;
      this._mainScene.openFinalMenu(data);
    });
  };

  private __onCloseButtonClick = ()=>{
    this._mainScene.closeFinalMenu(() => {
      this.__hideAdsBlock(false);
      this.__showLogin(10, this.__reset);
      this.playFartSong();
    });
  };

  private __reset = ()=>{
    console.log('reset game');
    this._lastUpdateTime = 0;
    this._state = STATES.MAIN;
    for(let i:number = 0; i < this._removeData.length; i++){
      ActorHelper.removePool.free(this._removeData[i]);
    }
    this._removeData.length = 0;
    (this.renderer as any).plugins.sprite.sprites.length = 0;
    //this.stop();
    this.__hideAdsBlock(false);
  };

  private __createEntity(delta:number, entity:any){
    this._gameScene.createEntity(entity);
  }

  private __updateEntity(delta:number, entity:any){
    this._gameScene.updateEntity(delta, entity);
  }

  private __removeEntity(data:ActorRemoveConfig){
    this._gameScene.removeEntity(data.id, data.assasin);
  }

  private __getWorldUpdate = (data:GameWorldState)=>{
    let delta:number = (this._lastUpdateTime) ? data.time - this._lastUpdateTime : 0;
    this._lastUpdateTime = data.time;

    for(let i:number = 0; i < this._removeData.length; i++){
      this.__removeEntity(this._removeData[i]);
      ActorHelper.removePool.free(this._removeData[i]);
    }

    this._removeData.length = 0;

    for(let i:number = 0; i < data.remove.length; i++){
      this._removeData.push(data.remove[i]);
    }

    for(let i:number = 0; i < data.create.length; i++){
      this.__createEntity(delta, data.create[i]);
    }

    for(let i:number = 0; i < data.update.length; i++){
      this.__updateEntity(delta, data.update[i]);
    }

    this._gameScene.sortActors();
  };

  private __onResize = (evt)=>{
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.onResizeWindow();
    if(this._gameScene && this._gameScene !== this.stage)this._gameScene.onResizeWindow();
    if(this._mainScene && this._mainScene !== this.stage)this._mainScene.onResizeWindow();
    if(this._skinSelectorScene && this._skinSelectorScene !== this.stage)this._skinSelectorScene.onResizeWindow();
    if(this._loaderScene !== this.stage)this._loaderScene.onResizeWindow();

    this.__scaleLoginContainer();
    setTimeout(()=>{
      this.__scaleLoginContainer();
    }, 1000);
  };

  private __scaleLoginContainer = ()=>{
    if(isApp)return;
    let scale = 1;
    if(window.innerHeight <= 695){
      scale = window.innerHeight/695;
      if(scale < 0.4){
        scale = 0.4;
      }else if(scale > 1){
        scale = 1;
      }
    }

    let strScale = (`rotate(0) scale(${scale}) skewX(0) skewY(0)`);
    let elements = document.querySelectorAll("div.v-container") as any;
    (elements as any[]).forEach((element)=>{
      element.style.transform = strScale;
      element.style.webkitTransform = strScale;
      element.style.MozTransform = strScale;
      element.style.msTransform = strScale;
      element.style.OTransform = strScale;
      element.style.transform = strScale;
    });
  };

  get stage():AbstractScene{
    return this.animationLoop.stage as AbstractScene;
  }

  set stage(stage:AbstractScene){
    this.animationLoop.stage = stage;
  }
}
