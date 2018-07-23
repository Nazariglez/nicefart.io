/**
 * Created by nazarigonzalez on 22/8/16.
 */
export class LiteralObjectPool<O> {
  protected _obj:string;
  protected _objects:O[] = [];

  constructor(obj:O, amount:number = 1){
    this._obj = JSON.stringify(obj);
    this.generate(amount);
  }

  resetCallback(obj:Object){}

  alloc():O{
    return this._objects.length ? this._objects.pop() : this.__createObj();
  }

  free(obj:O){
    this.resetCallback(obj);
    this._objects.unshift(obj);
  }

  clear(){
    this._objects.length = 0;
  }

  generate(amount:number){
    for(let i:number = 0; i < amount; i++)this._objects.push(this.__createObj());
  }

  protected __createObj():O{
    return JSON.parse(this._obj) as O;
  }

  get length():number {return this._objects.length;};
}

export class NodeLiteralObjectPool<O> extends LiteralObjectPool<O>{
  private _toFree:O[] = [];

  constructor(obj:O, amount:number = 1){
    super(obj, amount);
    if(typeof process === "undefined"){
      throw new Error('NodeLiteralObjectPool can not be used in this enviroment');
    }
  }

  free(obj:O){
    this._toFree.push(obj);
    process.nextTick(this.__freeObjects);
  }

  private __freeObjects = ()=>{
    if(!this._toFree.length)return;

    const obj:O = this._toFree.shift();
    this.resetCallback(obj);
    this._objects.unshift(obj);

    if(this._toFree.length){
      process.nextTick(this.__freeObjects);
    }
  };
}