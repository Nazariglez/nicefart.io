/**
 * Created by nazarigonzalez on 11/9/16.
 */
import * as sqlite from 'sqlite3';
import * as path from 'path';
import * as usage from 'usage';
import * as os from 'os';
sqlite.verbose();

const usageOpts:any = {keepHistory:true};
const TIME_TO_SAVE_SYSTEM:number = 10000;

const tables:{[name:string]:string[]} = {
  system: [
    "id INTEGER PRIMARY KEY AUTOINCREMENT",
    "date INT NOT NULL",
    "memory INT NOT NULL",
    "cpu REAL NOT NULL",
    "player_num INT NOT NULL",
    "actor_num INT NOT NULL",
    "food_num INT NOT NULL",
    "map_size INT NOT NULL",
    "loop_time REAL NOT NULL",
    "world_update_time REAL NOT NULL",
    "game_time REAL NOT NULL",
    "bytes_in REAL NOT NULL",
    "bytes_out REAL NOT NULL",
    "total_bytes_in REAL NOT NULL",
    "total_bytes_out REAL NOT NULL"
  ],
  games: [
    "id INTEGER PRIMARY KEY AUTOINCREMENT",
    "name TEXT NOT NULL",
    "start_date INT NOT NULL",
    "end_date INT",
    //"skin TEXT NOT NULL", //todo skin info
    "game_time REAL",
    "max_mass INT",
    "food_eaten INT",
    "players_killed INT",
    "bots_killed INT",
    "bytes_in INT",
    "bytes_out INT",
    "stars INT",
    "farts_fired INT",
    "farts_taken INT",
    "death_by INT",
    "out_time REAL",
    "run_time REAL",
    "mass_lost_fart INT",
    "mass_lost_time INT",
    "mass_lost_star INT",
    "mass_lost_drop INT",
    "max_top INT",
    //"top_time REAL",
    "max_mass_killed INT"
  ]
};

export interface SysData {
  time:number;
  players:number[];
  actors:number[];
  foods:number[];
  mapSize:number;
  loopTime:number[];
  worldUpdateTime:number[];
  bytesIn:number[];
  bytesOut:number[];
}

export class Statistics {
  private _path:string = path.resolve(__dirname, '../../utils', 'stats.sqlite3');
  private _db:sqlite.Database;
  private _openCallback:(err:Error)=>void;
  private _tablesCreated:number = 0;
  private _interval:any;

  isConnected:boolean = false;

  systemData:SysData = {
    time: 0,
    players: [],
    actors: [],
    foods: [],
    mapSize: 0,
    loopTime: [],
    worldUpdateTime: [],
    bytesIn: [],
    bytesOut: []
  };


  init(cb:(err:Error)=>void = function(err:Error){}){
    this._openCallback = cb;
    this._db = new sqlite.Database(this._path, this.__connected);
  }

  close(err?:(err:Error)=>void){
    this._db.close((_err:Error)=>{
      if(_err&&err)return err(_err);
      this.isConnected = false;
      if(err)return err(_err);
    });
  }

  sysStart(){
    if(os.platform() !== "darwin"){
      usage.clearHistory(process.pid);
    }
    this._interval = setInterval(this.__saveSystemData, TIME_TO_SAVE_SYSTEM);
  }

  sysStop(){
    clearInterval(this._interval);
  }

  saveGame(data:number[], cb:(err:Error)=>void){
    this._db.run(`INSERT INTO games (
      max_mass, food_eaten, players_killed, bots_killed, stars,
      farts_fired, farts_taken, death_by, out_time, run_time, mass_lost_fart,
      mass_lost_time, mass_lost_star, mass_lost_drop, max_top, max_mass_killed, bytes_in, bytes_out,
      game_time, end_date, name, start_date
      ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      data,
      function(err?:Error){
        if(err)return cb(err);
        cb(null);
      });
  }

  private __clearSysData(){
    this.systemData.time = 0;
    this.systemData.foods.length = 0;
    this.systemData.players.length = 0;
    this.systemData.actors.length = 0;
    this.systemData.mapSize = 0;
    this.systemData.worldUpdateTime.length = 0;
    this.systemData.loopTime.length = 0;
    this.systemData.bytesIn.length = 0;
    this.systemData.bytesOut.length = 0;
  }

  private __saveSystemData = ()=>{
    usage.lookup(process.pid, usageOpts, (err, result)=>{
      if(err)return console.error(err);
      const time:number = this.systemData.time;
      const mapSize:number = this.systemData.mapSize;
      const players:number = Math.floor(this.__averageFromArray(this.systemData.players));
      const actors:number = Math.floor(this.__averageFromArray(this.systemData.actors));
      const foods:number = Math.floor(this.__averageFromArray(this.systemData.foods));
      const loop:number = this.__averageFromArray(this.systemData.loopTime);
      const worldTime:number = this.__averageFromArray(this.systemData.worldUpdateTime);
      const bytesIn:number = this.__averageFromArray(this.systemData.bytesIn);
      const bytesOut:number = this.__averageFromArray(this.systemData.bytesOut);
      const cpu:number = result.cpu;
      const memory:number = result.memory;
      const date:number = Date.now();

      let totalBytesIn:number = 0;
      for(let i:number = 0; i < this.systemData.bytesIn.length; i++){
        totalBytesIn += this.systemData.bytesIn[i];
      }

      let totalBytesOut:number = 0;
      for(let i:number = 0; i < this.systemData.bytesOut.length; i++){
        totalBytesOut += this.systemData.bytesOut[i];
      }

      this.__clearSysData();

      this._db.run(`INSERT INTO system (
          game_time, 
          player_num, 
          actor_num, 
          food_num, 
          map_size,
          loop_time,
          world_update_time,
          cpu,
          memory,
          bytes_in,
          total_bytes_in,
          bytes_out,
          total_bytes_out,
          date
        ) VALUES (
          ${time},
          ${players},
          ${actors},
          ${foods},
          ${mapSize},
          ${loop},
          ${worldTime},
          ${cpu},
          ${memory},
          ${bytesIn},
          ${totalBytesIn},
          ${bytesOut},
          ${totalBytesOut},
          ${date}
        )`, this.__onInsertSystemData);
    });
  };

  private __onInsertSystemData = (err:Error)=>{
    if(err)return console.error(err);
  };

  private __averageFromArray(arr:number[]):number{
    const len:number = arr.length;
    let val:number = 0;
    for(let i:number = 0; i < len; i++){
      val += arr[i];
    }

    return val/len;
  }

  private __createTables(){
    for(const t in tables){
      if(tables.hasOwnProperty(t)){
        let sql:string = `CREATE TABLE IF NOT EXISTS ${t} (`;

        tables[t].forEach((s:string, i:number)=>{
          sql += s;
          if(i < tables[t].length-1)sql += ", ";
        });

        sql += ")";

        this._db.run(sql, this.__tableCreated);
      }
    }
  }

  private __tableCreated = (err:Error)=>{
    if(err)return this._openCallback(err);
    this._tablesCreated++;

    if(this._tablesCreated === Object.keys(tables).length){
      this.isConnected = true;
      this._openCallback(null);
      this._db.all("SELECT world_update_time as ws, player_num as pl FROM system", (err:Error, row:any)=>{
        let m:number = 0;
        row.forEach((r)=>{
          m+= (r.ws/(r.pl||1));
        });
        console.log('World Update Time average', m/row.length);
      });
    }
  };

  private __connected = (err:Error)=>{
    if(err)return this._openCallback(err);
    this.isConnected = true;
    this.__createTables();
  };
}

export const stats:Statistics = new Statistics();