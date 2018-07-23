/**
 * Created by nazarigonzalez on 3/7/16.
 */
import {LiteralArrayPool, NodeLiteralArrayPool} from "./LiteralArrayPool";
import {isMobile} from "../client/helpers/device";

export function linearInterpolator(from:number, to:number, totalTime:number, elapsedTime:number):number{
  return from + ((to-from)*elapsedTime)/totalTime;
}

export function angleBetween(x1:number, y1:number, x2:number, y2:number):number{
  return Math.atan2(y2-y1, x2-x1);
}

export function distanceBetween(x1:number, y1:number, x2:number, y2:number):number{
  const xx:number = (x1-x2);
  const yy:number = (y1-y2);
  return Math.sqrt(xx*xx + yy*yy);
}

export function safeMarginMass(mass:number):number {
  return 25 + mass * 0.025;
}

let _arrayPool:LiteralArrayPool|NodeLiteralArrayPool;
if(typeof process === "undefined"){
  _arrayPool = new LiteralArrayPool(200);
}else{
  _arrayPool = new NodeLiteralArrayPool(200);
}

export const arrayPool = _arrayPool;

export const minActorScreenSize:number = isMobile ? 24 : 55;
export const maxActorScreenSize:number = isMobile ? 115 : 280;
export const crazyEffectTime:number = 15000;