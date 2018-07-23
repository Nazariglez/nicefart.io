/**
 * Created by nazarigonzalez on 3/9/16.
 */
import ObjPool from "obj-pool";

export default class ScoreText extends PIXI.Text{
  static pool:ObjPool<any> = new ObjPool(ScoreText, {amount: 1});
  private _moving:boolean = false;
  private _topHeight:number = 0;

  constructor(){
    super("", {
      fill:0xffffff,
      stroke:"#000000",
      strokeThickness: 4,
      font: "14px Ubuntu",
      align: "center"
    });
    this.anchor.set(0.5);
    this.resolution = 2;
    this.alpha = 0.6;
  }

  show(text:string, color:number = 0xffffff, alpha:number = 0.6, height?:number){
    if(this.tint !== color)this.tint = color;
    this.text = text;
    this._moving = true;
    this.position.set(
      -10 + Math.random()*20,
      -10 + Math.random()*10
    );

    this.alpha = alpha;
    this._topHeight = this.position.y - (height || (20 + Math.random()*20));
  }

  reset(){
    this._moving = false;
    this.alpha = 0.6;
    this.scale.set(1);
  }

  update(delta:number){
    super.update(delta);
    if(this._moving){
      if(this.alpha > 0)this.alpha -= 0.4*delta;
      this.position.y -= 60*delta;

      if(this.position.y <= this._topHeight){
        this.__remove();
      }
    }
  }

  private __remove(){
    if(this.parent){
      this.parent.removeChild(this);
      ScoreText.pool.free(this);
    }
  }
}