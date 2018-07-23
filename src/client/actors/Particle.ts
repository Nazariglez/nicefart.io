/**
 * Created by nazarigonzalez on 21/1/17.
 */

declare type ParticleContainer = PIXI.Container|PIXI.ParticleContainer;

export let particleList:PIXI.particles.Emitter[] = [];

export class Particle {
  private _emitter:PIXI.particles.Emitter;
  private _config:any;

  container:ParticleContainer;
  mass:number = 999999;

  constructor(){}

  addConfig(container:PIXI.Container, texture:PIXI.Texture|PIXI.Texture[], config:any){
    this._emitter = new PIXI.particles.Emitter(
      container,
      texture,
      config
    );

    this._config = config;
  }

  start(){
    if(this.isRunning){
      this._emitter.emit = false;
    }

    if(this.__getEmitterIndex() === -1){
      particleList.push(this._emitter);
    }

    this._emitter.emit = true;
  }

  stop(){
    if(!this.isRunning)return;
    this._emitter.emit = false;
    let index:number = this.__getEmitterIndex();
    if(index !== -1){
      particleList.splice(index, 1);
    }
  }

  updatePos(x:number, y:number, reset:boolean = false) {
    if(reset){
      this._emitter.resetPositionTracking();
    }

    if(this._emitter){
      this._emitter.updateOwnerPos(x,y);
    }
  }

  setScale(n:number){
    if(this.isConfigured){
      this._emitter.startScale = this._config.scale.start * n;
      this._emitter.endScale = this._config.scale.end * n;

      this._emitter.maxLifetime = this._config.lifetime.max * n;
      this._emitter.minLifetime = this._config.lifetime.min * n;

      this._emitter.startSpeed = this._config.speed.start * n;
      this._emitter.endSpeed = this._config.speed.end * n;
    }
  }

  private __getEmitterIndex() : number {
    let index:number = -1;
    let len:number = particleList.length;
    for(let i:number = 0; i < len; i++){
      if(particleList[i] === this._emitter){
        index = i;
        break;
      }
    }

    return index;
  }

  get isRunning():boolean {
    return this._emitter&&this._emitter.emit;
  }

  get isConfigured():boolean {
    return !!this._emitter;
  }
}

export function updateParticles(delta:number) {
  let len:number = particleList.length;
  for(let i:number = 0; i < len; i++)particleList[i].update(delta);
}