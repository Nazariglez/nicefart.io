/**
 * Created by nazarigonzalez on 22/7/16.
 */

declare module 'rbush'{
  export interface ItemInterface {
    minX:number;
    maxX:number;
    minY:number;
    maxY:number;
    [propName:string]:any;
  }

  export interface rbush {
    new(maxEntries?:number, format?:string[]):rbush;
    insert(item:ItemInterface);
    remove(item:ItemInterface);
    clear();
    load(items:ItemInterface[]);
    search(query:ItemInterface):ItemInterface[];
    collides(query:ItemInterface):boolean;
    toJSON():any;
  }
}