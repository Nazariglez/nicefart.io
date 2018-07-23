import plugins from './plugins';
import Game from './Game';
import config from './config';
import {lockLandscape} from "./helpers/device";

//Force the typescript compiler to include this plugins in the bundle (avoid dead modules)
let _plugins = plugins;

//lock orientation
if(lockLandscape()){
  console.log('Locked landscape');
}

//Init the game
let game = new Game(config.game.version, config.pixi);
game.initialize();
