/**
 * Created by nazarigonzalez on 9/6/16.
 */
///<reference path="../../typings/rbush.d.ts" />
///<reference path="../../typings/uws.d.ts" />
import config from './config';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as errorHandler from 'errorhandler';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as WebSocket from 'uws';
import {stats, Statistics} from './Statistics';

import {authLogin} from './routes/auth';
import {checkPort} from './core/utils';
import GameManager from './core/GameManager';

const inDevelopmentMode:boolean = process.env.NODE_ENV !== "production";
const app = express();
const server:http.Server = http.createServer(app);

app.use(compression()); //gzip
app.use(express.static(path.resolve(__dirname, '../','../build/client')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if(inDevelopmentMode){
  app.use(errorHandler());
}

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-type, Accept");
  next();
});

app.get('/', (req, res)=>res.sendFile(path.resolve(__dirname, '../', '../build/client', 'index.html')));
app.post('/auth', authLogin);

let gameManager:GameManager = new GameManager(config.server.games, config.server.players);

const websocketOptions:any = { server: server };
const wss = new WebSocket.Server(websocketOptions);
wss.on('connection', function(ws:WebSocket) {
  gameManager.newConnection(ws);
});
server.on('upgrade', function(req, socket){
  console.log('handshake'); //todo check handshake
  //http://blog.kotowicz.net/2011/03/html5-websockets-security-new-tool-for.html
  //https://github.com/websockets/ws/blob/f0c56991000d9106a4a1115bf1b2e594e6a2cb58/test/testserver.js
});

let port:number = config.server.port;
function init(err, valid):void{
  if(err){
    return console.error(err);
  }

  if(!valid){
    port += 10;
    return checkPort(port, init);
  }

  server.listen(port, function(){
    console.log('Server up and listening on port %d in %s mode.', port, app.settings.env);
  });
}

stats.init(function(err){
  if(err)return console.error(err);
  checkPort(port, init);
});
