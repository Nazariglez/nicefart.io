/**
 * Created by nazarigonzalez on 10/7/16.
 */

import AbstractScene from "./AbstractScene";
import config from '../config';
import Game from "../Game";
let _run = 0;

export default class DebugScene extends AbstractScene{
  private _radius:number = 50;
  background:PIXI.extras.TilingSprite;

  constructor(public game:Game){
    super(game);
    this.__onInit();
  }

  private __onInit = ()=>{
    const size:number = config.game.size;
    console.log('init');

    const m = Math.max(this._renderer.width, this._renderer.height);
    this.background = new PIXI.extras.TilingSprite(PIXI.loader.resources["tileBack"].texture, m, m);
    this.background.tileScale.set(this.world.scale.x);
    this.background.anchor.set(0.5);
    //this.background.pivot.set(this.background.width/2, this.background.height/2);
    //this.background.position.set

    this.addChildAt(this.background, 0);

    const colors:number[] = [
      0xE3CEAE, //piel blanquita
      0x43310b, //negro
      0xf7e6c8, //chino
      0x22b573, //ET
    ];

    const cols:number = 4;
    const rows:number = 3;
    let hh:number = (size-10*rows)/rows;
    let ww:number = (size-10*cols)/cols;
    let _ww:number = size*0.5;
    let _hh:number = size*0.5;

    /*for(let y:number = 0; y < rows; y++){
      for(let x:number = 0; x < cols; x++){
        this.world.addChild(this.__getCulo(-_ww+(ww*x)+ww/2 + 10*x, -_hh+(hh*y)+hh/2 + 10*y, Math.min(ww, hh), colors[Math.floor(Math.random()*colors.length)]));
      }
    }*/

    let c;

    this.world.addChild(
      c = this.__getCulo(
        0, 0, this._radius*2, colors[0]
      )
    );

    const w = 1000;
    const h = 1000;
    this.background.tileScale.set(this.world.scale.x);
    this.background.tilePosition.set(w,h);

    const me = this;
    function x(){
      const n = 200;
      let ww = config.game.size*me.world.scale.x;
      let ratio3 = n/(c.width*me.world.scale.x);

      const camScale = ratio3*me.world.scale.x;
      me.world.scale.set(camScale);
      console.log(ww, c.width, camScale, ratio3);
    }

    let a = new PIXI.Graphics()
      .lineStyle(2, 0x0ff0ff)
      .drawCircle(0, 0, 100);

    this.ui.addChild(a);
    this.ui.scale.set(1.3);
    this.world.scale.set(1.3);
  };


  onResizeWindow(){
    let me = this;
    if(!this.world)return;
    const ss = this.world.scale.x;
    super.onResizeWindow();
    //this.world.scale.x = 0.5; //todo: remove this, just for testing purposes
    const a = this.world.scale.x - ss;
    if(this.background){
      const scale = this.world.scale.x;

      const max = Math.max(this._renderer.width, this._renderer.height);
      this.background.scale.set(max/this.background.width);
      this.background.tileScale.set(scale/this.background.scale.x);
      //this.background.width = this._renderer.width;
      //this.background.height = this._renderer.height;
      //const sx = ((this._renderer.width - ww)/2);
      //const sy = ((this._renderer.height - hh)/2);

      //const offX = sx*a;
      //const offY = sy*a;
      //this.background.tilePosition.x = this.background.tilePosition.x - sx + offX;
      //this.background.tilePosition.y = this.background.tilePosition.y - sy + offY;
      //this.background.tileScale.set(scale);

      //console.log(sx, sy, offX, offY, scale);
    }
  }

  update(delta:number){
    super.update(delta);
    //this.background.tileScale.set(this.world.scale.x);
    if(_run > 0){
      _run -= delta;
      (window as any).run(this.background.tileScale.x + (0.1*delta))
    }

  }

  private __existsCollisionBetween(actor1:any, actor2:any, radiusPercent:number = 100):boolean {
    const margin:number = radiusPercent/100;
    const xx:number = (actor1.position.x - actor2.position.x);
    const yy:number = (actor1.position.y - actor2.position.y);
    const distance:number = Math.sqrt(xx*xx + yy*yy);
    const radius1:number = actor1.radius*margin;
    const radius2:number = actor2.radius*margin;
    return distance < radius1+radius2;
  }

  private __getCulo = (x:number, y:number, ww:number, color:number)=>{
    const c:number[] = [
      0xff0000,
      0xffa500,
      0x00ff00,
      0x0000ff
    ];

    let sprite:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources['culo_base'].texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(x, y);
    sprite.tint = color;
    sprite.width = sprite.height = ww;
    (sprite as any).radius = ww/2;

    const style = 1 + Math.floor(Math.random()*5);

    if(Math.random() < 0.9) {
      switch (style) {
        case 1:
          //Aristocrata
          let aristo:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources['aristo'].texture);
          aristo.anchor.set(0.5, 0.5);
          sprite.addChild(aristo);
          break;
        case 2:
          //Terminator
          let glass:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources['gafas'].texture);
          glass.anchor.set(0.5);
          sprite.addChild(glass);

          let hair:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources['pelo'].texture);
          hair.anchor.set(0.5);
          hair.tint = c[Math.floor(Math.random() * c.length)];
          sprite.addChild(hair);
          break;
        case 3:
          //Clown
          let clown:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["payaso"].texture);
          clown.anchor.set(0.5);
          sprite.addChild(clown);

          let _hair:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["pelo_payaso"].texture);
          _hair.anchor.set(0.5);
          _hair.tint = c[Math.floor(Math.random() * c.length)];
          sprite.addChild(_hair);

          let bombin:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["bombin"].texture);
          bombin.anchor.set(0.5);
          sprite.addChild(bombin);
          break;
        case 4:
          //FartyPotter
          let potter:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["potter"].texture);
          potter.anchor.set(0.5);
          sprite.addChild(potter);
          break;
        case 5:
          //matasuegra
          let suegra:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["matasuegra"].texture);
          suegra.anchor.set(0.5);
          sprite.addChild(suegra);

          let hat:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["fiesta"].texture);
          hat.anchor.set(0.5);
          sprite.addChild(hat);
          break;
      }
    }

    return sprite;
  };

}
