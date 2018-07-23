/**
 * Created by nazarigonzalez on 20/6/16.
 */
export default class LogicLoop {
  private _firstDate:number = 0;
  private _last:number = 0;
  private _lastTime:number = 0;
  private _ref;

  delta:number = 0;
  deltaMS:number = 0;
  time:number = 0;
  isRunning:boolean = false;

  constructor(public FPS:number=60){}

  start():void{
    if(this.isRunning)return;
    this.isRunning = true;
    let now:number = Date.now();
    this._last = now;

    if(this._firstDate === 0){
      this._firstDate = now;
    }

    this.update();
    this.onStart();
  }

  stop():void{
    if(!this.isRunning)return;
    this.isRunning = false;
    clearTimeout(this._ref);
    this.onStop();
  }

  update = ()=>{
    this._ref = setTimeout(this.update, 1000/this.FPS);
    let now:number = Date.now();
    this.time += (now-this._last)/1000;
    this.delta = this.time - this._lastTime;
    this.deltaMS = this.delta*1000;
    this._lastTime = this.time;
    this._last = now;
    this.onUpdate(this.delta, this.deltaMS);
  };

  onStart():void{}
  onStop():void{}
  onUpdate(delta:number, deltaMS:number):void{}
}
