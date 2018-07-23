import AbstractScene from './AbstractScene';
import Game from "../Game";
import {logo as tarentolaLogo} from '../tarentola';
import {isApp} from "../helpers/device";
import config from "../config";
let hd = window.devicePixelRatio === 2 ? "@2x" : "";

export default class LoaderScene extends AbstractScene {
  barWidth = 300;
  barHeight = 16;
  vel = 130; //Progress added per second
  loader:PIXI.loaders.Loader;
  isStarted:boolean;
  allLoaded:boolean;
  progress:number;
  loadBar:PIXI.Graphics;

  private _onLoadCallback:()=>void;

  resources = [
    {name:"nicefartLogo", url:"./assets/img/NF_io_logo_Blanco2_min.png"},
    {name:"clouds", url:"./assets/img/clouds3.png"},
    {name:"fartSong", url: ["./assets/audio/fartsong.ogg", "./assets/audio/fartsong.mp3"]},
    {name:"beans", url:"./assets/img/beans2.json"},
    {name:"nicefart1", url:"./assets/img/nicefart1.json"},
    {name:"particles", url:"./assets/img/particles.json"},
    {name:"general", url:"./assets/img/general.json"},
    {name:"tileBack", url:"./assets/img/TileBack_gray.png"}
  ];

  constructor(public game:Game){
    super(game);
    this.loader = PIXI.loader;
    this.loader.add(this.resources);
    this.isStarted = false;
    this.allLoaded = false;
    this.progress = 5;
    this._onLoadCallback = function(){};

    let logoTexture:PIXI.Texture = PIXI.Texture.fromImage(tarentolaLogo);
    logoTexture.mipmap = true;
    let logo:PIXI.Sprite = new PIXI.Sprite(logoTexture);
    logo.scale.set(0.5);
    logo.anchor.set(0.5);

    if(!isApp){
      logo.position.set(0, -75);
    }else{
      logo.position.set(0, -50);
    }

    this.ui.addChild(logo);

    //loadBar
    this.loadBar = new PIXI.Graphics();

    if(!isApp){
      this.loadBar.position.set(0, 75);
    }else{
      this.loadBar.position.set(0, 90);
    }

    this.drawBar(0.2);
    this.ui.addChild(this.loadBar);

  }

  update(delta){
    super.update(delta);
    if(!this.isStarted)return;

    if(this.progress < this.loader.progress || !this.resources.length){
      this.progress += this.vel*delta;
    }

    if(this.progress >= 100 && !this.allLoaded){
      this.allLoaded = true;
      this.__enableMipMap();
      this._onLoadCallback();
    }else{
      this.drawBar(this.progress);
    }
  }



  drawBar(progress){
    if(progress > 100)progress = 100;
    this.loadBar.clear();
    this.loadBar.beginFill(0xc0c0c0, 0.5);
    this.loadBar.drawRect(-(this.barWidth/2), -(this.barHeight/2), this.barWidth, this.barHeight);
    this.loadBar.endFill();

    if(progress){
      let calc = (progress*this.barWidth)/100;
      this.loadBar.beginFill(0x1BFF70, 0.5);
      this.loadBar.drawRect(-(this.barWidth/2), -(this.barHeight/2), calc, this.barHeight);
      this.loadBar.endFill();
    }

    this.loadBar.lineStyle(2, 0x000000, 0.5);
    this.loadBar.drawRect(-(this.barWidth/2), -(this.barHeight/2), this.barWidth, this.barHeight);
  }

  load(callback){
    this.isStarted = true;
    if(callback)this._onLoadCallback = callback;
    this.loader.pre(this.__versionCache);
    this.loader.load();
  }

  private __versionCache(resource:any, next:()=>void) {
    //avoid the agressive cache of some browsers
    resource.url += "?v=" + config.game.version;
    next();
  }

  private __enableMipMap() {
    PIXI.loader.resources["nicefart1"].textures["fart00.png"].baseTexture.mipmap = true;
    PIXI.loader.resources["general"].textures["arrow.png"].baseTexture.mipmap = true;
  }
}
