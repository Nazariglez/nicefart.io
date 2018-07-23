/**
 * Created by nazarigonzalez on 11/4/17.
 */
import {isApp} from "./device";

const SLOT_NAME = "nicead";
const OUT_TIME = 3*60*1000;
const GAME_TIME = 12*60*1000;
const INITIAL_interstitial_COUNT = isApp ? 3 : 2;
const interstitial_COUNT = isApp ? 4 : 5;

declare const ADMOB_ANDROID_INTERSTITIAL:string;
declare const ADMOB_IOS_INTERSTITIAL:string;
declare const Cocoon:any;

declare const aipPlayer:any;
declare const NoADS:boolean;

class AdsManager {
  private _count:number = 0;
  private _initiated:boolean = false;
  private _time:number = 0;
  private _intervalRef:any = 0;
  private _lastDate:number = 0;
  private _adPlayer:any;
  private _lastCheck:number = 0;
  private _admobService:any;
  private _admobInterstitial:any;
  private _admobLoaded:boolean = false;

  constructor(){
    this.__loadData();
    this.__initClock();
  }

  init(){
    if(!isApp){
      this.__loadAdinplay();
    }else{
      this.__loadAtomicAdmob();
    }
  }

  displayinterstitial(cb:(success:boolean)=>void = (success:boolean)=>{}){
    if(this.NoADS){
      cb(false);
      return;
    }

    this._count++;
    let countTo:number = interstitial_COUNT;
    if(!this._initiated){
      countTo = INITIAL_interstitial_COUNT;
    }

    this._interstitialCallback = cb;

    if((this._initiated && Date.now()-this._lastCheck > GAME_TIME) || this._count >= countTo){
      this._count = 0;
      this.__displayinterstitial();
    }else{
      this._interstitialCallback(false);
    }

    this._lastCheck = Date.now();
    this.save();
  }

  save(){
    localStorage.setItem(SLOT_NAME, JSON.stringify({last:this._lastCheck, ini: this._initiated, n:this._count, time: this._time}));
  }

  private _interstitialCallback(success:boolean){}

  private __loadAtomicAdmob(){
    this._admobService = Cocoon.Ad;
    this._admobService.configure({
      ios: {
        interstitial:ADMOB_IOS_INTERSTITIAL,
      },
      android: {
        interstitial:ADMOB_ANDROID_INTERSTITIAL
      }
    });

    this._admobInterstitial = this._admobService.createInterstitial();
    this._admobInterstitial.on("load", this.__onAdmobLoad);
    this._admobInterstitial.on("fail", ()=>{
      this._interstitialCallback(false);
    });
    this._admobInterstitial.on("show", ()=>{
      this._admobLoaded = false;
    });
    this._admobInterstitial.on("dismiss", ()=>{
      this._interstitialCallback(true);
      this._admobInterstitial.load();
    });

    this._admobInterstitial.on("click", function(){
      console.log("Interstitial clicked");
    });

    this._admobInterstitial.load();
  }

  private __loadAdinplay(){
    const preRoll = document.createElement("div");
    preRoll.id = "preroll";
    document.body.appendChild(preRoll);
    console.log('added preroll');
    getScript('//api.adinplay.com/player/v2/NCF/nicefart.io/player.min.js', ()=>{
      this.__initAipPreroll();
    });
  }

  private __initAipPreroll(){
    console.log('Init AipPreroll');
    const me = this;
    if(typeof aipPlayer != "undefined") {
      this._adPlayer = new aipPlayer({
        AD_WIDTH: 960,
        AD_HEIGHT: 540,
        AD_FULLSCREEN: false,
        PREROLL_ELEM: document.getElementById('preroll'),
        AIP_COMPLETE: function ()  {
          console.log('Interstitial DISPLAYED');
          me._interstitialCallback(true);
        },
        AIP_REMOVE: function ()  {}
      });
      (window as any).adPlayer = this._adPlayer;
    } else {
      console.log('Interstitial FAILED');
      me._interstitialCallback(false);
    }
  }

  private __displayinterstitial(){
    console.log('display interstitial');
    this._initiated = true;
    if(!isApp){
      this._adPlayer.startPreRoll();
    }else{
      if(this._admobLoaded){
        this._admobInterstitial.show();
      }else{
        this._interstitialCallback(false);
      }
    }
  }

  private __onAdmobLoad = ()=>{
    console.log('admob loaded');
    this._admobLoaded = true;
  };

  private __initClock(){
    this._intervalRef = setInterval(()=>{
      this._time = Date.now();
      this.save();
    }, 5000);
  }

  private __loadData(){
    let data:any;
    let dataSaved = localStorage.getItem(SLOT_NAME);
    if(dataSaved){
      try {
        data = JSON.parse(dataSaved);
      } catch(e){
        data = {last: 0, time:0, n: 0, ini: false};
      }
    }else{
      data = {last: 0, time:0, n: 0, ini: false};
    }

    console.log(Date.now(), data.time, OUT_TIME, Date.now()-data.time);
    if(Date.now()-data.time < OUT_TIME){
      this._initiated = data.ini;
      this._count = data.n;
      this._lastDate = data.time;
      //this._lastCheck = data.last;
    }

    console.log(this._initiated, this._count, this._lastDate);
  }

  get NoADS():boolean {
    return typeof NoADS !== "undefined" && NoADS;
  }
}
const adsManager = new AdsManager();
export default adsManager;

function getScript (src, callback) {
  const headElm = document.head || document.getElementsByTagName('head')[0];
  const script = document.createElement("script") as any;
  let once = true;
  script.async = "async";
  script.type = "text/javascript";
  script.charset = "UTF-8";
  script.src = src;
  script.onload = script.onreadystatechange = function () {
    if (once && (!script.readyState || /loaded|complete/.test(script.readyState))) {
      once = false;
      callback();
      script.onload = script.onreadystatechange = null;
    }
  };

  headElm.appendChild(script);
}
