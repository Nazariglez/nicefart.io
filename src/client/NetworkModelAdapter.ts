/**
 * Created by nazarigonzalez on 10/6/16.
 */
import config from './config';
import {
  MSG_ID, MSG_STATUS, AuthResult, AuthSuccessResult,
  INPUT_FLAG, getErrorMessage, MSG_SUCCESS, MSG_ERROR, ENTITY_TYPE, UPDATE_CODE, DEATH_BY, skinsInfo
} from '../common/interfaces';
import {BufferViewPool, BufferView, BINARY} from "../common/Binary";
import {ActorHelper} from "./helpers/ActorHelper";
import {FoodHelper} from "./helpers/FoodHelper";
import {FartShootHelper} from "./helpers/FartShootHelper";
import {MedicineHelper} from "./helpers/MedicineHelper";
import {PowerUpHelper} from "./helpers/PowerUpHelper";
import {arrayPool} from "../common/utils";
import {isApp} from "./helpers/device";
import skinsConfig from "./skins";

export type CallbackSuccess<T> = (data?:T)=>void;
export type CallbackError = (err:Error)=>void;

enum STATUS {
  CREATED, INITIALIZING, INITIALIZED, CLOSED
}

export default class NetworkModelAdapter {
  private _status:STATUS = STATUS.CREATED;
  private _ws:WebSocket;
  private _host:string;
  private _signedRequest:string;

  private _successInitCallback:CallbackSuccess<any>;
  private _errorInitCallback:CallbackError;

  private _gameState:any = {
    time: 0,
    create: [],
    update: [],
    remove: []
  };

  constructor(){}

  init(data:any, success:CallbackSuccess<any>, error:CallbackError){
    if(this._status !== STATUS.CREATED && this._status !== STATUS.CLOSED)return;
    this.status = STATUS.INITIALIZING;
    this.__getAuth(data, success, error);
  }

  sendInput = (angle:number, force:number, fast:boolean = false, fire:boolean = false, pepper:boolean = false)=>{
    if(this.status !== STATUS.INITIALIZED)return;
    let flags:number = 0;
    if(fast)flags |= INPUT_FLAG.FAST;
    if(fire)flags |= INPUT_FLAG.FIRE;
    if(pepper)flags |= INPUT_FLAG.PEPPER;

    let view:BufferView = BufferViewPool.alloc(5);
    view.autoSet(BINARY.UInt8, MSG_ID.INPUT);
    view.autoSet(BINARY.Int16, angle*PIXI.RAD_TO_DEG);
    view.autoSet(BINARY.UInt8, force);
    view.autoSet(BINARY.UInt8, flags);
    this._ws.send(view.buffer);
    BufferViewPool.free(view);
  };

  getWorldUpdate(data:any){}
  onCloseTime(data:any){}
  updateLeaderboard(data:any[]){}
  updateRadar(data:number[]){}

  getSkins(success:CallbackSuccess<any>, error:CallbackError) : any{
    if(isApp){
      //don't request if is cordova
      success(skinsConfig as skinsInfo);
      return;
    }

    const req:XMLHttpRequest = new XMLHttpRequest();
    req.open("POST", `${config.game.host}/config`);
    req.onload = function onLoad(){
      if(req.status === 200){
        const contentType:string = req.getResponseHeader("Content-Type");
        if(contentType.indexOf("application/json") !== -1){
          success(JSON.parse(req.response) as skinsInfo);
        }else{
          error(new Error(`Wrong mime type in response: ${contentType}`));
          return;
        }
      }else{
        error(new Error(req.responseText || req.statusText));
      }
    };

    req.onerror = (evt:Event)=>{
      error(new Error("Unable to connect. Try again.\n"));
    };

    req.setRequestHeader("Content-type", "application/json");
    req.send(null);
  }

  private __getAuth(data:any, success:CallbackSuccess<any>, error:CallbackError){
    const me = this;
    const req:XMLHttpRequest = new XMLHttpRequest();
    req.open("POST", `${config.game.host}/auth`);
    req.onload = function onLoad(){
      if(req.status === 200){
        let res:AuthResult;

        const contentType:string = req.getResponseHeader("Content-Type");
        if(contentType.indexOf("application/json") !== -1){
          res = JSON.parse(req.response);
        }else{
          error(new Error(`Wrong mime type in response: ${contentType}`));
          me.status = STATUS.CLOSED;
          return;
        }

        if(res.status === "success"){
          me.__onSuccessLogin(success, error, res.data);
        }else{
          error(new Error(res.description));
          me.status = STATUS.CLOSED;
          return;
        }
      }else{
        error(new Error(req.responseText || req.statusText));
        me.status = STATUS.CLOSED;
      }
    };

    req.onerror = (evt:Event)=>{
      error(new Error("Unable to connect. Try again.\n"));
      me.status = STATUS.CLOSED;
    };

    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(data));
  }

  private __getInitialData(success:CallbackSuccess<any>, error:CallbackError, skin:string[]){
    if(this.status !== STATUS.INITIALIZED)return;
    this._successInitCallback = success;
    this._errorInitCallback = error;
    this._ws.send(new Uint8Array([MSG_ID.INIT]).buffer);
    localStorage.setItem("lastSkin", JSON.stringify(skin));
  }

  private __onSuccessLogin = (success:CallbackSuccess<any>, error:CallbackError, data:AuthSuccessResult)=>{
    if(!data || !data.token){
      this.status = STATUS.CLOSED;
      return error(new Error('Invalid auth token.'));
    }
    let me = this;
    this._signedRequest = data.token;
    this._host = data.host;
    this._ws = new WebSocket(`${this._host}`);
    this._ws.binaryType = "arraybuffer";

    function onOpen(evt:any){
      console.log('WS Open', evt);
      let view:BufferView = BufferViewPool.alloc(1+BufferView.stringBytes(me._signedRequest));
      view.autoSet(BINARY.UInt8, MSG_ID.AUTH);
      view.autoSet(BINARY.String, me._signedRequest);
      me._ws.send(view.buffer);
      BufferViewPool.free(view);
    }

    function onMessage(evt:any){
      //console.log('WS Message', evt, new Uint8Array(evt.data));
      let view:BufferView = BufferViewPool.allocFromArrayBuffer(evt.data);
      if(view.get(0, BINARY.UInt8) === MSG_STATUS.SUCCESS){
        me._ws.onmessage = me.__onMessage;
        me._ws.onclose = me.__onClose;
        me.status = STATUS.INITIALIZED;
        me.__getInitialData(success, error, data.skin);
      }else{
        error(new Error(getErrorMessage(view.get(2, BINARY.UInt8))));
        me.status = STATUS.CLOSED;
      }
      BufferViewPool.free(view);
    }

    function onClose(evt:any){
      console.log('WS Refuse connection');
      me.status = STATUS.CLOSED;
      me._ws = null;
      error(new Error('Connection error.'));
    }

    this._ws.onopen = onOpen;
    this._ws.onmessage = onMessage;
    this._ws.onclose = onClose;
  };

  private __onMessage = (evt:any)=>{
    if(!(evt.data instanceof ArrayBuffer))return;
    let view:BufferView = BufferViewPool.allocFromArrayBuffer(evt.data);
    let status:number = view.get(0, BINARY.UInt8);
    if(status === MSG_STATUS.SUCCESS) {
      this.__handleSuccessMessage(view.get(1, BINARY.UInt8), view.get(2, BINARY.UInt8));
      BufferViewPool.free(view);
    }else if(status === MSG_STATUS.INFO){
      this.__handleInfoMessage(view);
    }else{
      this.__handleErrorMessage(view.get(1, BINARY.UInt8), view.get(2, BINARY.UInt8));
      BufferViewPool.free(view);
    }
  };

  private __handleInfoMessage(view:BufferView){
    switch(view.get(1, BINARY.UInt8)){
      case MSG_ID.WORLD:
        this.__processWorldBuffer(view);
        break;
      case MSG_ID.CLOSE:
        let d:any = {
          time: view.get(2, BINARY.UInt16),
          deathType: view.autoGet(BINARY.UInt8),
          points: view.autoGet(BINARY.UInt8),
          gameTime: view.autoGet(BINARY.UInt32),
          mass: view.autoGet(BINARY.UInt32),
          top: view.autoGet(BINARY.UInt8),
          topTime: view.autoGet(BINARY.UInt16),
        };

        if(d.deathType === DEATH_BY.PLAYER){
          d.killer = view.autoGet(BINARY.String);
        }

        this.onCloseTime(d);
        break;
      case MSG_ID.INIT:
        let data:any[] = [view.get(2, BINARY.UInt8)*100]; //scene size
        data[1] = ActorHelper.getCreateConfigFromBuffer(view, 3);
        this._successInitCallback(data);
        break;
      case MSG_ID.RANK:
        this.__processRankBuffer(view);
        break;
      case MSG_ID.RADAR:
        this.__processRadar(view);
        break;
    }
    BufferViewPool.free(view);

    return;
  }

  private __processRankBuffer(view:BufferView){
    let arr:any[] = arrayPool.alloc();
    arr.push(view.get(2, BINARY.UInt16));
    while (view.index < view.byteLength){
      arr.push(view.autoGet(BINARY.UInt8));
      arr.push(view.autoGet(BINARY.String));
    }

    this.updateLeaderboard(arr);
  }

  private __processRadar(view:BufferView){
    let len:number = view.autoGet(BINARY.Int16);
    let arr:any[] = arrayPool.alloc();

    while (view.index < view.byteLength){
      arr.push(view.autoGet(BINARY.Int16))
    }

    if(len !== arr.length/2){
      console.error('Invalid radar data');
      return;
    }

    this.updateRadar(arr);
  }

  private __processWorldBuffer(view:BufferView){
    //console.log(new Uint8Array(view.buffer));
    this._gameState.create.length = 0;
    this._gameState.update.length = 0;
    this._gameState.remove.length = 0;
    this._gameState.time = view.get(2, BINARY.Float32);

    while (view.index < view.byteLength){
      const type:number = view.autoGet(BINARY.UInt8);
      const updateCode:number = view.autoGet(BINARY.UInt8);

      switch(type){
        case ENTITY_TYPE.ACTOR:
          if(updateCode === UPDATE_CODE.CREATE){
            this._gameState.create.push(ActorHelper.getCreateConfigFromBuffer(view, view.index));
          }else if(updateCode === UPDATE_CODE.UPDATE){
            this._gameState.update.push(ActorHelper.getUpdateConfigFromBuffer(view, view.index));
          }
          break;
        case ENTITY_TYPE.FOOD:
          if(updateCode === UPDATE_CODE.CREATE){
            this._gameState.create.push(FoodHelper.getCreateConfigFromBuffer(view, view.index));
          }else if(updateCode === UPDATE_CODE.UPDATE){
            this._gameState.update.push(FoodHelper.getUpdateConfigFromBuffer(view, view.index));
          }
          break;
        case ENTITY_TYPE.FART_SHOOT:
          if(updateCode === UPDATE_CODE.CREATE){
            this._gameState.create.push(FartShootHelper.getCreateConfigFromBuffer(view, view.index));
          }else if(updateCode === UPDATE_CODE.UPDATE){
            this._gameState.update.push(FartShootHelper.getUpdateConfigFromBuffer(view, view.index));
          }
          break;
        case ENTITY_TYPE.POWER_UP:
          if(updateCode === UPDATE_CODE.CREATE){
            this._gameState.create.push(PowerUpHelper.getCreateConfigFromBuffer(view, view.index));
          }else if(updateCode === UPDATE_CODE.UPDATE){
            this._gameState.update.push(PowerUpHelper.getUpdateConfigFromBuffer(view, view.index));
          }
          break;
        case ENTITY_TYPE.MEDICINE:
          if(updateCode === UPDATE_CODE.CREATE){
            this._gameState.create.push(MedicineHelper.getCreateConfigFromBuffer(view, view.index));
          }else if(updateCode === UPDATE_CODE.UPDATE){
            this._gameState.update.push(MedicineHelper.getUpdateConfigFromBuffer(view, view.index));
          }
          break;
        case ENTITY_TYPE.MISC:
          //always remove
          this._gameState.remove.push(ActorHelper.getRemoveConfigFromBuffer(view, view.index));
          break;
      }
    }

    //console.log(JSON.stringify(this._gameState));
    this.getWorldUpdate(this._gameState);
  }

  //todo, success and error really needed?
  private __handleErrorMessage(id:MSG_ID, msg:MSG_ERROR){
    switch (id){
      case MSG_ID.INIT:
        this._errorInitCallback(new Error(getErrorMessage(msg)));
        break;
    }
  }

  private __handleSuccessMessage(id:MSG_ID, msg:MSG_SUCCESS){
    switch (id){
      case MSG_ID.INIT:
        this._successInitCallback(msg);
        break;
    }

  }

  private __onClose = (evt:any)=>{
    console.log('WS Close', evt);
    this._ws = null;
    this.status = STATUS.CLOSED;
    BufferViewPool.clear();
  };

  get status():STATUS {return this._status};
  set status(value:STATUS){
    if(value !== this._status){
      this._status = value;
    }
  }
}

