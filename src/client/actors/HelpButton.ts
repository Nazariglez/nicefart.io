/**
 * Created by nazarigonzalez on 29/1/17.
 */
const text:string = " ?";
export default class HelpButton extends PIXI.Text {
  private _overM:boolean = false;

  constructor(){
    super(text, {
      fill:0xffffff,
      stroke:"#000000",
      strokeThickness: 6,
      font: "30px Ubuntu",
      align: "center"
    });

    this.hitArea = new PIXI.Rectangle(-30, -30, 70, 70);

    this.interactive = true;
    this.on('tap', this.__onClick);
    this.on('click', this.__onClick);
    this.on('mouseover', this.__onOver);
    this.on('mouseout', this.__onOut);
  }

  onClick(){}
  setText(t:string = text){
    this.text = t;
  }

  private __onClick = (evt:any)=>{
    console.log('click');
    this.onClick();
  };

  private __onOver = (evt:any)=>{
    if(this._overM)return;
    this._overM = true;
    this.tint = 0xc6ffd9;
  };

  private __onOut = (evt:any)=>{
    this._overM = false;
    this.tint = 0xffffff;
  };

}