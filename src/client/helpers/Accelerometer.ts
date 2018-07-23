/**
 * Created by nazarigonzalez on 12/1/17.
 */
import * as device from './device';

export default class Accelerometer {
  isEnabled:boolean = false;

  x:number = 0;
  y:number = 0;
  z:number = 0;

  constructor(){}

  enable(value:boolean = true){
    if(value !== this.isEnabled){
      this.isEnabled = value;

      if(value){
        this.__enableEvents();
      }else{
        this.__disableEvents();
      }

    }
  }

  disable(){
    this.enable(false);
  }

  set(accel:any){
    this.x = accel.x || 0;
    this.y = accel.y || 0;
    this.z = accel.z || 0;
  }

  private __enableEvents = ()=>{
    if(device.hasAccelerometer){
      window.addEventListener("devicemotion", this.__onDeviceMotion, true);
    }
  };

  private __disableEvents = ()=>{
    if(device.hasAccelerometer){
      window.removeEventListener('devicemotion', this.__onDeviceMotion, true);
    }
  };

  private __onDeviceMotion = (evt:any)=>{
    this.set(evt.accelerationIncludingGravity);
  };
}