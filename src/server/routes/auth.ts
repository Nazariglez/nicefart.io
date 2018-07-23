/**
 * Created by nazarigonzalez on 9/6/16.
 */
import * as express from 'express';

import {generateAuthCredentials} from '../core/auth';
import {parseSkinConfig} from "../../common/skins";

const dummyUser = {
  id: "53545",
  name: "dummyuser",
  password: 123456,

  toJSON(){
   return {
     name: this.name,
     id: this.id
   };
  }
};

export function authLogin(req:express.Request, res:express.Response){
  if(req.body){
    if(!req.body.guest && (!req.body.name || !req.body.password))return sendError(res, "Missed username or password");

    if(req.body.guest){
      const name:string = req.body.name || "Guest";

      if(name.length > 12 || name.indexOf(".io") !== -1 || name.indexOf("www.") !== -1 || name.indexOf("http:") !== -1){
        return sendError(res, "Invalid request.");
      }

      let skinInvalid:boolean = false;
      let skin:any[];
      try {
        skin = JSON.parse(req.body.skin)
      }catch (e){
        skinInvalid = true;
      }

      if(!req.body.skin || skinInvalid || req.body.skin.length < 3){ //todo sanitize this
        return sendError(res, "Invalid request.");
      }

      let authCredentials:any = generateAuthCredentials({
        name: name,
        id: -Math.floor(Math.random()*999999),
        skin: skin
      });
      authCredentials.host = getServer();

      return sendOk(res, authCredentials);
    }else{
      /*return findUser(req.body.name, req.body.password, (err, user)=>{
        if(err)return sendError(res, err);
        if(!user)return sendError(res, "Wrong password or username.");

        let authCredentials:any = generateAuthCredentials(user.toJSON());
        authCredentials.host = getServer();

        return sendOk(res, authCredentials);
      }); */
      return sendError(res, "Invalid request.") as any;
    }
  }

  return res.status(400).end();
}

function findUser(name, password, callback){
  if(name === dummyUser.name && password === dummyUser.password)return callback(null, dummyUser);
  return callback(null, null); //no user founded.
}

function sendOk(res:express.Response, msg:any):express.Response{
  return res.send({
    status: "success",
    data: msg
  });
}

function sendError(res:express.Response, msg:string):express.Response{
  return res.send({
    status: "error",
    description: msg
  });
}

function getServer():string{
  //todo: get a server ip to balance
  //return "139.59.155.202:5000";
  //return "localhost:5000";
  //return "localhost:8080";
  return "192.168.1.101:8080";
}
