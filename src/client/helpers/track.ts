/**
 * Created by nazarigonzalez on 19/9/16.
 */
import {isApp} from "./device";

declare const ga:any;

export function track(name:string, action:string, label?:string, value?:number){
  if(isApp)return;

  if(typeof ga === "undefined" || !ga){
    return console.log('Not found analytics.js');
  }

  let data:any = {
    eventCategory: name,
    eventAction: action
  };

  if(label)data.eventLabel = label;
  if(value||typeof value === "number")data.eventValue = Math.round(value);

  ga('send', 'event', data);
}
