/**
 * Created by nazarigonzalez on 11/6/16.
 */
import * as WebSocket from 'uws';
import {GameCore} from "./GameCore";
import {WebsocketConnection} from "./WebsocketConnection";
import {MSG_ID, INPUT_FLAG} from "../../common/interfaces";
import {stats} from "../Statistics";

const DEG_TO_RAD:number = Math.PI/180;

export default class GameManager {
  private _players:WebsocketConnection[] = [];
  private _games:GameCore[] = [];
  private _playerLimitInGame:number;

  constructor(games:number, playerLimit:number){
    this._playerLimitInGame = playerLimit;
    for(let i = 0; i < games; i++){
      this._games.push(new GameCore(this._playerLimitInGame));
    }
    //console.log(`- ${games} games up!`);
  }

  newConnection(conn:WebSocket){
    const player:WebsocketConnection = new WebsocketConnection(conn);
    player.onSuccessConnection = this.__onPlayerConnection;
    player.onDisconnect = this.__onPlayerDisconnect;
    player.onMessageReceived = this.__onMessageReceived;
  }

  addPlayer(player:WebsocketConnection){
    this._players.push(player);
    this.__addPlayerInGame(player);
  }

  removePlayer(player:WebsocketConnection){
    const index:number = this._players.indexOf(player);
    if(index !== -1){
      this._players.splice(index, 1);
    }

    this._games.forEach((g:GameCore)=>g.removePlayer(player));
  }

  private __addPlayerInGame(player:WebsocketConnection){
    const firstLimit:number = this._playerLimitInGame/2;
    let game:GameCore;
    let index:number;

    //fill the game with less players than size/2
    for(let i = 0; i < this._games.length; i++){
      if(this._games[i].players.length < firstLimit){
        game = this._games[i];
        index = i;
        break;
      }
    }

    //If all the games have more than size/2 players, add in the game with less players
    if(!game){
      let min:number = 9999999;
      for(let i = 0; i < this._games.length; i++){
        if(this._games[i].players.length < min){
          min = this._games[i].players.length = min;
          game = this._games[i];
          index = i;
        }
      }
    }

    if(game.players.length >= this._playerLimitInGame){
      console.log('WARNING! Full sized games...');
    }

    game.addPlayer(player);
    //console.log('Added a player in the game:', index);
  }

  private __onPlayerConnection = (player:WebsocketConnection)=>{
    //console.log('Player connected! ');
  };

  private __onPlayerDisconnect = (player:WebsocketConnection)=>{
    this.removePlayer(player);
  };

  private __onMessageReceived = (player:WebsocketConnection, msg:Buffer)=>{
    stats.systemData.bytesIn.push(msg.byteLength);

    switch(msg.readUInt8(0)){
      case MSG_ID.INPUT:
        if(msg.byteLength !== 5){
          player.close(); //kick, ilegal length
        }else{
          this.__onPlayerInput(player, msg);
        }
        break;
      case MSG_ID.INIT:
        this.__onPlayerInit(player, msg);
        break;
    }
  };

  private __onPlayerInput = (player:WebsocketConnection, data:Buffer)=>{
    if(player.actor){
      const angle:number = data.readInt16BE(1);
      let force:number = data.readUInt8(3);
      const flags:number = data.readUInt8(4);

      if(force < 0){
        force = 0;
      }else if(force > 10){
        force = 10;
      }

      player.actor.force = force; //number between 0-10?
      player.actor.fast = !!(flags&INPUT_FLAG.FAST);
      player.actor.angle = angle*DEG_TO_RAD;
      player.actor.fire = !!(flags&INPUT_FLAG.FIRE);
    }
  };

  private __onPlayerInit = (player:WebsocketConnection, data:Buffer)=>{
    this.addPlayer(player);
    let _data:any;
    for(let i:number = 0; i < this._games.length; i++){
      if(this._games[i].isPlayerIn(player)){
        _data = this._games[i].getInitialDataFor(player);
        break;
      }
    }

    player.sendInitialData(_data);
  };

}
