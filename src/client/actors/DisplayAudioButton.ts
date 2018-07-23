/**
 * Created by nazarigonzalez on 25/3/17.
 */
export default class DisplayAudioButton extends PIXI.Sprite {
  isEnabled:boolean = true;

  constructor(){
    super(PIXI.loader.resources["general"].textures["audioOn.png"]);
    this.anchor.set(0.5);

    this.interactive = true;
    this.on('click', this.__onClick);
    this.on('tap', this.__onClick);
    this.buttonMode = true;
    this.defaultCursor = "pointer";
  }

  onToggle(status:boolean){}

  enable(){
    this.texture = PIXI.loader.resources["general"].textures["audioOn.png"];
    this.tint = 0x00ff00;
    this.isEnabled = true;
  }

  disable(){
    this.texture = PIXI.loader.resources["general"].textures["audioOff.png"];
    this.tint = 0xcfcfcf;
    this.isEnabled = false;
  }

  private __onClick = (evt:any)=>{
    if(this.isEnabled){
      this.disable();
    }else{
      this.enable();
    }

    this.onToggle(this.isEnabled);
  };
}