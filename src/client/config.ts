import {isCocoon, isApp} from './helpers/device';
let view:any;
if(isCocoon){
  view = document.createElement("canvas");
  view.screencanvas = true;
  view.width = window.innerWidth;
  view.height = window.innerHeight;

  let dummySelector = {
    addEventListener: function(){},
    removeEventListener: function(){}
  };

  (document as any).querySelector = function() {
    return dummySelector
  };

  (document as any).querySelectorAll = function(){
    return [];
  }
}

export default {
  pixi: {
    width: window.innerWidth,
    height: window.innerHeight,
    webgl: true, //false for 2dContext, true for autoDetectRenderer
    rendererOptions: {
      //pixi rendererOptions
      backgroundColor: 0x000000,
      antialias: !isCocoon
    },
    view: isCocoon ? view : document.querySelector("canvas#game")
  },

  game: {
    version: "<--GAME_VERSION-->",
    size: isApp ? 390 : 512,
    host: 'http://<--CORE_IP-->',
    interpolation: true,
    effects: true,
    skinConfig: "<--SKIN_CONFIG-->"
  }
};
