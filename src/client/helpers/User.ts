/**
 * Created by nazarigonzalez on 4/2/17.
 */
import Game from "../Game";
import {skinConfig, costumeConfig, customSkinConfig} from "../../common/interfaces";
import {isApp} from "./device";

const slotName:string = "nicefart";

declare interface skinStore {
  skins:string[];
  costumes:string[];
}

export default class User {
  beans:number = 999999; //todo remove in the beta (0 value)
  skinID:string = "";
  costumeID:string = "";
  firstTime:boolean = true;
  name:string = "";
  share:boolean = false;
  agree:boolean = isApp;
  music:boolean = true;
  skins:skinStore = {
    skins: [],
    costumes: []
  };

  private _purchasedSkins:string[] = [];
  private _purchasedCostumes:string[] = [];

  constructor(public game:Game){
    this.__loadData();
  }

  save(){
    window.localStorage.setItem(slotName, JSON.stringify(this.toJSON()));
  }

  loadServerData(){
    //todo get beans, skins and costume purchased from the server
    //this._model.getUserData(cb);
  }

  getSkinConfig() : customSkinConfig {
    let skin:skinConfig;
    let costume:costumeConfig;

    if(this.game.skins && this.game.skins.skins && this.game.skins.skins.length){
      for(let i=0; i < this.game.skins.skins.length; i++){
        if(this.game.skins.skins[i].id === this.skinID){
          skin = this.game.skins.skins[i];
          break;
        }
      }
    }

    if(this.game.skins && this.game.skins.costumes && this.game.skins.costumes.length) {
      for (let i = 0; i < this.game.skins.costumes.length; i++) {
        if (this.game.skins.costumes[i].id === this.costumeID) {
          costume = this.game.skins.costumes[i];
          break;
        }
      }
    }

    return {
      skin: skin || this.game.skins.skins[0],
      costume: costume || this.game.skins.costumes[0]
    };
  }

  toJSON():any {
    return {
      firstTime: false,
      beans:this.beans,
      skinID:this.skinID,
      costumeID:this.costumeID,
      name: this.name,
      share: this.share,
      agree: this.agree,
      music: this.music,
      skins: this.skins
    };
  }

  unlockSkin(id:string){
    if(this.skins.skins.indexOf(id) !== -1)return;
    this.skins.skins.push(id);
    this.save();
    console.log("Unlocked skin:", id);
  }

  unlockCostume(id:string){
    if(this.skins.costumes.indexOf(id) !== -1)return;
    this.skins.costumes.push(id);
    this.save();
    console.log('Unlocked costume:', id);
  }

  hasSkin(id:string):boolean {
    return this.skins.skins.indexOf(id) !== -1;
  }

  hasCostume(id:string):boolean {
    return this.skins.costumes.indexOf(id) !== -1;
  }

  private __loadData(){
    let data:any = window.localStorage.getItem(slotName);
    if(data){
      data = JSON.parse(data);
      this.beans = data.beans;
      this.skinID = data.skinID;
      this.costumeID = data.costumeID;
      this.firstTime = !!data.firstTime;
      this.name = data.name || "";
      this.share = data.share || false;
      this.agree = isApp ? true : (data.agree || false);
      this.music = typeof data.music === "undefined" ? true : data.music;
      this.skins = data.skins || {skins:[],costumes:[]};
    }else{
      this.save();
    }
  }
}