/**
 * Created by nazarigonzalez on 22/8/16.
 */
export class LiteralArrayPool {
  protected _objects:any[][] = [];

  constructor(amount:number = 1){
    this.generate(amount);
  }

  resetCallback(obj:any[]){
    obj.length = 0;
  }

  alloc():any[]{
    return this._objects.length ? this._objects.pop() : [];
  }

  free(obj:any[]){
    this.resetCallback(obj);
    this._objects.unshift(obj);
  }

  clear(){
    this._objects.length = 0;
  }

  generate(amount:number){
    for(let i:number = 0; i < amount; i++)this._objects.push([]);
  }

  get length():number {return this._objects.length;};
}

export class NodeLiteralArrayPool extends LiteralArrayPool{
  private _toFree:any[] = [];

  constructor(amount:number = 1){
    super(amount);
    if(typeof process === "undefined"){
      throw new Error('NodeLiteralObjectPool can not be used in this enviroment');
    }
  }

  free(obj:any[]){
    this._toFree.push(obj);
    process.nextTick(this.__freeObjects);
  }

  private __freeObjects = ()=>{
    if(!this._toFree.length)return;

    const obj:any[] = this._toFree.shift();
    this.resetCallback(obj);
    this._objects.unshift(obj);

    if(this._toFree.length){
      process.nextTick(this.__freeObjects);
    }
  };

}