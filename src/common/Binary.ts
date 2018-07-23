/**
 * Created by nazarigonzalez on 20/8/16.
 */
import ObjPool from "obj-pool";

const _bufferViewPools:ObjPool<any>[] = [];
const _bufferViewToFree:BufferView[] = [];

export enum BINARY {
  Int8, UInt8, Int16, UInt16, Int32, UInt32, Float32, Float64, String
}

export class BufferViewPool {
  static alloc(length:number):BufferView{
    if(!_bufferViewPools[length]){
      _bufferViewPools[length] = new ObjPool(BufferView, {amount: 5, args: [length]});
    }
    return _bufferViewPools[length].alloc();
  }

  static free(view:BufferView){
    view.clear();
    _bufferViewPools[view.byteLength].free(view);
  }

  static allocFromArrayBuffer(buffer:ArrayBuffer):BufferView{
    if(!_bufferViewPools[buffer.byteLength]){
      _bufferViewPools[buffer.byteLength] = new ObjPool(BufferView, {amount: 5, args: [buffer.byteLength]});
    }
    return BufferView.fromArrayBuffer(buffer);
  }

  static clear(){
    for(let i:number = 0; i < _bufferViewPools.length; i++){
      if(_bufferViewPools[i]){
        _bufferViewPools[i].clear();
      }
    }
  }

  static get len():number {
    let n:number = 0;
    for(let i:number = 0; i < _bufferViewPools.length; i++){
      if(_bufferViewPools[i])n += _bufferViewPools[i].length;
    }
    return n;
  }

}

if(typeof process !== "undefined"){
  BufferViewPool.free = function free(view:BufferView){
    _bufferViewToFree.push(view);
    process.nextTick(__freeNodeBufferView);
  }
}

function __freeNodeBufferView(){
  if(!_bufferViewToFree.length)return;

  const view:BufferView = _bufferViewToFree.shift();
  view.clear();
  _bufferViewPools[view.byteLength].free(view);

  if(_bufferViewToFree.length){
    process.nextTick(__freeNodeBufferView);
  }
}

export class BufferView {
  private _dataView:DataView;
  private _index:number = 0;

  endianess:boolean = false;

  static stringBytes(str:string):number {
    return str.length*2 + 2; //two bytes to indicate the real string length
  }

  static fromArrayBuffer(buffer:ArrayBuffer):BufferView{
    return new BufferView(0, buffer);
  }

  constructor(bytes:number, buffer?:ArrayBuffer){
    this._dataView = new DataView(buffer ? buffer : new ArrayBuffer(bytes));
  }

  set(index:number, type:BINARY, value:number|string){
    switch(type){
      case BINARY.Int8:
        this._dataView.setInt8(index, value as number);
        this._index = index+1;
        break;
      case BINARY.UInt8:
        this._dataView.setUint8(index, value as number);
        this._index = index+1;
        break;
      case BINARY.Int16:
        this._dataView.setInt16(index, value as number, this.endianess);
        this._index = index+2;
        break;
      case BINARY.UInt16:
        this._dataView.setUint16(index, value as number, this.endianess);
        this._index = index+2;
        break;
      case BINARY.Int32:
        this._dataView.setInt32(index, value as number, this.endianess);
        this._index = index+4;
        break;
      case BINARY.UInt32:
        this._dataView.setUint32(index, value as number, this.endianess);
        this._index = index+4;
        break;
      case BINARY.Float32:
        this._dataView.setFloat32(index, value as number, this.endianess);
        this._index = index+4;
        break;
      case BINARY.Float64:
        this._dataView.setFloat64(index, value as number, this.endianess);
        this._index = index+8;
        break;
      case BINARY.String:
        //add first 1 byte as string.length
        let str:string = (value as string);
        this.set(index, BINARY.UInt16, str.length);
        for(let i:number = 0; i < str.length; i++){
          //check big and little endian
          this.set(this._index, BINARY.UInt16, str.charCodeAt(i));
        }
        break;
    }
  }

  get(index:number, type:BINARY){
    let val:any;
    switch(type){
      case BINARY.Int8:
        val = this._dataView.getInt8(index);
        this._index = index+1;
        break;
      case BINARY.UInt8:
        val = this._dataView.getUint8(index);
        this._index = index+1;
        break;
      case BINARY.Int16:
        val = this._dataView.getInt16(index, this.endianess);
        this._index = index+2;
        break;
      case BINARY.UInt16:
        val = this._dataView.getUint16(index, this.endianess);
        this._index = index+2;
        break;
      case BINARY.Int32:
        val = this._dataView.getInt32(index, this.endianess);
        this._index = index+4;
        break;
      case BINARY.UInt32:
        val = this._dataView.getUint32(index, this.endianess);
        this._index = index+4;
        break;
      case BINARY.Float32:
        val = this._dataView.getFloat32(index, this.endianess);
        this._index = index+4;
        break;
      case BINARY.Float64:
        val = this._dataView.getFloat64(index, this.endianess);
        this._index = index+8;
        break;
      case BINARY.String:
        //read first 1 byte as string.length
        const len:number = this.get(index, BINARY.UInt16);
        let str:string = "";
        for(let i:number = 0; i < len; i++){
          //check big and little endian
          str += String.fromCharCode(this.get(this._index, BINARY.UInt16));
        }
        val = str;
        break;
    }
    return val;
  }

  clear(){
    this._index = 0;
  }

  autoSet(type:BINARY, value){
    this.set(this._index, type, value);
  }

  autoGet(type:BINARY):number{
    return this.get(this._index, type);
  }

  get index():number {return this._index;};
  set index(value:number){
    if(value !== this._index)this._index = value;
  }

  get buffer():ArrayBuffer {return this._dataView.buffer;};
  get byteLength():number {return this._dataView.byteLength;};
}

export function stringFromDataView(view:DataView, index:number, endianess:boolean = false):string{
  const len:number = view.getUint16(index, endianess);
  let str:string = "";
  for(let i:number = 0; i < len; i++){
    str += String.fromCharCode(view.getUint16((index+1)+(i*2), endianess));
  }
  return str;
}

export function stringFromNodeBuffer(buffer:Buffer, index:number, endianess:boolean = false):string{
  const len:number = endianess ? buffer.readUInt16LE(index) : buffer.readUInt16BE(index);
  let str:string = "";
  for(let i:number = 0; i < len; i++){
    let n:number = (index+2)+(i*2);
    str += String.fromCharCode(
      endianess ? buffer.readUInt16LE(n) : buffer.readUInt16BE(n)
    );
  }
  return str;
}
