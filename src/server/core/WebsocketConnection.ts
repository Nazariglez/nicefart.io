/**
 * Created by nazarigonzalez on 10/6/16.
 */
import * as WebSocket from 'uws';
import {isValidAuthToken, getPayloadFromToken} from "./auth";
import {Actor} from "../Actor";
import {
  MSG_STATUS, MSG_ID, MSG_ERROR, MSG_SUCCESS,
  ACTOR_BINARY
} from "../../common/interfaces";
import {stringFromNodeBuffer, BufferView, BufferViewPool, BINARY} from "../../common/Binary";
import {arrayPool} from "../../common/utils";
import {stats} from "../Statistics";

const TIME_TO_KILL:number = 4050;
const TIME_QUOTA_CHECK:number = 2000;
const MAX_REQUEST:number = 50;

export class WebsocketConnection{
  private _valid:boolean = false;
  private _quota:number = 0;
  private _quotaTimeout:any;
  private _lastUpdate:any = {};
  private _leaderboard:any[] = [];
  private _leaderPosition:number = -1;
  private _startDate:number;

  time:number = 0;

  actor:Actor;
  clientData:any;

  statsData:number[];
  bytesIn:number = 0;
  bytesOut:number = 0;

  constructor(private _connection:WebSocket){
    //console.log('New Websocket Connection');

    this._connection.on('message', this.__onAuthMessage);
    this._connection.on('close', this.__onClose);

    this._quota = 0;
    this.__checkQuota();
  }

  onDisconnect(player:WebsocketConnection){}
  onSuccessConnection(player:WebsocketConnection){}
  onMessageReceived(player:WebsocketConnection, data:any){}

  sendSuccess(msgId:MSG_ID, data:MSG_SUCCESS){
    this.__sendSuccess(msgId, data);
  }

  sendError(msgId:MSG_ID, msg:MSG_ERROR){
    this.__sendError(msgId, msg);
  }

  sendLeaderboard(actors:Actor[]){
    let arr:any[] = arrayPool.alloc();
    arr[0] = 0;

    let send:boolean = false;
    const index:number = actors.indexOf(this.actor)+1;
    if(this.actor.statsData.maxTop === 0 || index < this.actor.statsData.maxTop){
      this.actor.statsData.maxTop = index;
    }

    if(this._leaderPosition !== index){
      this._leaderPosition = index;
      send = true;
    }

    for(let i:number = 0; i < 10; i++){
      if(this._leaderboard[i] !== actors[i].name){
        send = true;
        arr.push(i, actors[i].name);
        arr[0] += BufferView.stringBytes(actors[i].name)+1;
      }

      this._leaderboard[i] = actors[i].name;
    }

    if(send){
      let view:BufferView = BufferViewPool.alloc(arr[0]+4);
      view.autoSet(BINARY.UInt8, MSG_STATUS.INFO);
      view.autoSet(BINARY.UInt8, MSG_ID.RANK);
      view.autoSet(BINARY.UInt16, this._leaderPosition);
      const len:number = (arr.length-1)/2;
      for(let i:number = 0; i < len; i++){
        let n:number = (i*2)+1;
        view.autoSet(BINARY.UInt8, arr[n]);
        view.autoSet(BINARY.String, arr[n+1]);
      }
      this._connection.send(view.buffer);
      stats.systemData.bytesOut.push(view.byteLength);
      this.bytesOut += view.byteLength;
      BufferViewPool.free(view);
    }

    arrayPool.free(arr);
  }

  sendUpdate(data:any[]){
    if((data.length-1) === 0){
      arrayPool.free(data);
      return;
    }

    let view:BufferView = BufferViewPool.alloc(data[0] + 6);
    view.autoSet(BINARY.UInt8, MSG_STATUS.INFO);
    view.autoSet(BINARY.UInt8, MSG_ID.WORLD);
    view.autoSet(BINARY.Float32, this.time);

    const len:number = (data.length-1)/2;
    for(let i:number = 0; i < len; i++){
      let n:number = (i*2)+1;
      view.autoSet(data[n] as BINARY, data[n+1]);
    }

    this._connection.send(view.buffer);
    arrayPool.free(data);
    stats.systemData.bytesOut.push(view.byteLength);
    this.bytesOut += view.byteLength;
    BufferViewPool.free(view);
  }

  sendInitialData(data:any[]){
    //todo: initial
    let len:number = 3; //scene size
    for(let i:number = 0; i < data[1].length; i++){
      switch(ACTOR_BINARY[i]){
        case BINARY.Int8:
        case BINARY.UInt8:
          len += 1;
          break;
        case BINARY.Int16:
        case BINARY.UInt16:
          len += 2;
          break;
        case BINARY.Int32:
        case BINARY.Float32:
        case BINARY.UInt32:
          len += 4;
          break;
        case BINARY.Float64:
          len += 8;
          break;
        case BINARY.String:
          len += BufferView.stringBytes(data[1][i]);
          break;
        default:
          //skin
          len += data[1][i].length;
          break;
      }
    }

    let view:BufferView = BufferViewPool.alloc(len);
    view.autoSet(BINARY.UInt8, MSG_STATUS.INFO);
    view.autoSet(BINARY.UInt8, MSG_ID.INIT);
    view.autoSet(BINARY.UInt8, data[0]);
    view.autoSet(ACTOR_BINARY[0], data[1][0]);
    view.autoSet(ACTOR_BINARY[1], data[1][1]);
    view.autoSet(ACTOR_BINARY[2], data[1][2]);
    view.autoSet(ACTOR_BINARY[3], data[1][3]);
    view.autoSet(ACTOR_BINARY[4], data[1][4]);
    view.autoSet(ACTOR_BINARY[5], data[1][5]);
    view.autoSet(ACTOR_BINARY[6], data[1][6]);
    view.autoSet(ACTOR_BINARY[7], data[1][7]);
    view.autoSet(ACTOR_BINARY[8], data[1][8]);
    for(let i:number = 0; i < data[1][9].length; i++){
      view.autoSet(BINARY.UInt8, data[1][9][i]);
    }

    this._connection.send(view.buffer);
    stats.systemData.bytesOut.push(view.byteLength);
    this.bytesOut += view.byteLength;
    let b = new Uint8Array(view.buffer);
    console.log(JSON.stringify(b));
    BufferViewPool.free(view);
    arrayPool.free(data[1]);
  }

  kill(){
    this.statsData = this.actor.getStatsData();

    let view:BufferView = BufferViewPool.alloc(4);
    view.autoSet(BINARY.UInt8, MSG_STATUS.INFO);
    view.autoSet(BINARY.UInt8, MSG_ID.CLOSE);
    view.autoSet(BINARY.UInt16, TIME_TO_KILL);
    this._connection.send(view.buffer);
    stats.systemData.bytesOut.push(view.byteLength);
    this.bytesOut += view.byteLength;
    BufferViewPool.free(view);
    setTimeout(this.__closeConnection, TIME_TO_KILL);
  }

  close(){
    this._connection.close();
  }

  private __closeConnection = ()=>{
    this._connection.close();
    //console.log('close connection');
  };

  private __checkQuota = ()=>{
    //console.log('quota', this._quota);
    if(this._quota > MAX_REQUEST){
      console.log(`User kicked by quota check.`);
      this._connection.close();
    }else{
      this._quota = 0;
      this._quotaTimeout = (setTimeout(this.__checkQuota, TIME_QUOTA_CHECK) as any);
    }
  };

  private __sendSuccess(msgId:MSG_ID, msg:MSG_SUCCESS){
    let view:BufferView = BufferViewPool.alloc(3);
    view.autoSet(BINARY.UInt8, MSG_STATUS.SUCCESS);
    view.autoSet(BINARY.UInt8, msgId);
    view.autoSet(BINARY.UInt8, msg);
    this._connection.send(view.buffer);
    stats.systemData.bytesOut.push(view.byteLength);
    this.bytesOut += view.byteLength;
    BufferViewPool.free(view);
  }

  private __sendError(msgId:MSG_ID, msg:MSG_ERROR){
    let view:BufferView = BufferViewPool.alloc(3);
    view.autoSet(BINARY.UInt8, MSG_STATUS.ERROR);
    view.autoSet(BINARY.UInt8, msgId);
    view.autoSet(BINARY.UInt8, msg);
    this._connection.send(view.buffer);
    stats.systemData.bytesOut.push(view.byteLength);
    this.bytesOut += view.byteLength;
    BufferViewPool.free(view);
  }

  private __onAuthMessage = (message:Buffer, flags:any)=>{
    this._quota++;

    if(message instanceof Buffer){
      const msgId:number = message.readUInt8(0);
      if(msgId !== MSG_ID.AUTH){
        this.__sendError(MSG_ID.AUTH, MSG_ERROR.InvalidAuth);
        this._connection.close();
        return;
      }

      const signedRequest:string = stringFromNodeBuffer(message, 1);
      if(isValidAuthToken(signedRequest)){
        this.__onSuccessAuth(signedRequest);
      }else{
        this.__sendError(MSG_ID.AUTH, MSG_ERROR.InvalidAuth);
        this._connection.close();
      }

    }else{
      this.__sendError(MSG_ID.AUTH, MSG_ERROR.InvalidAuth);
      this._connection.close();
    }
  };

  private __onMessage = (message:Buffer)=>{
    this._quota++;
    if(message instanceof Buffer){
      this.__handleMessage(message);
    }else{
      this._connection.close();
    }
  };

  private __onClose = (evt)=>{
    if(!this.statsData){
      this.statsData = this.actor.getStatsData();
    }

    stats.saveGame(this.__parseEndData(), (err:Error)=>{
      if(err)return console.error(err);
      arrayPool.free(this.statsData);
      this.statsData = null;
    });

    clearTimeout(this._quotaTimeout);
    this._lastUpdate = {}; //todo, pool this?
    //console.log('close ');
    if(!this._valid)return;
    this.onDisconnect(this);
  };

  private __parseEndData = ()=>{
    this.statsData.push(
      this.bytesIn, this.bytesOut,
      this.time, Date.now(), this.clientData.name, this._startDate
    );

    return this.statsData;
  };

  private __onSuccessAuth = (token:string)=>{
    this._valid = true;
    this._connection.removeListener('message', this.__onAuthMessage);
    this._connection.on('message', this.__onMessage);
    //console.log('Successful auth.',token);

    this.clientData = getPayloadFromToken(token);
    this._startDate = Date.now();

    this.__sendSuccess(MSG_ID.AUTH, MSG_SUCCESS.Auth);
    this.onSuccessConnection(this);
  };

  private __handleMessage = (message:Buffer)=>{
    this.onMessageReceived(this, message);
    this.bytesIn += message.byteLength;
  };

  get lastUpdate():any {return this._lastUpdate;};
}
