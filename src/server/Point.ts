/**
 * Created by nazarigonzalez on 20/6/16.
 */
export default class Point{
  constructor(public x:number = 0, public y:number = 0){}

  clone():Point {
    return new Point(this.x, this.y);
  }

  copy(point:Point):void{
    this.set(point.x, point.y);
  }

  equals(point:Point):boolean{
    return (point.x === this.x) && (point.y === this.y);
  }

  set(x:number, y?:number):void{
    this.x = x || 0;
    this.y = y || ( (y !== 0) ? this.x : 0 ) ;
  }

}
