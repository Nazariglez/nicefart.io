/**
 * Created by nazarigonzalez on 29/1/17.
 */
import {isDesktop, isApp} from "../helpers/device";
import FastButton from "./FastButton";
import FartButton from "./FartButton";
import PepperButton from "./PepperButton";
import DisplayFartShoot from "./DisplayFartShoot";
import config from "../config";

export default class Tutorial extends PIXI.Container {
  private _ww:number = 500;
  private _hh:number = 400;
  private _bg:PIXI.Graphics;
  private _titleText:PIXI.Text;
  private _slideContainer:PIXI.Container;

  private _forwardButton:PIXI.Sprite;
  private _backwardButton:PIXI.Sprite;

  private _slides:Slide[] = [];
  private _slideIndex:number = 0;

  constructor(){
    super();

    this._bg = new PIXI.Graphics();
    this.addChild(this._bg);

    this._forwardButton = new PIXI.Sprite(PIXI.loader.resources["general"].textures["arrow.png"]);
    this._forwardButton.anchor.set(1);
    this._forwardButton.scale.set(0.8);
    this._forwardButton.position.set(this._ww/2 - 10, this._hh/2 - 10);
    this.addChild(this._forwardButton);

    this._forwardButton.interactive = true;
    this._forwardButton.on('click', this.__onForward);
    this._forwardButton.on('tap', this.__onForward);

    this._backwardButton = new PIXI.Sprite(PIXI.loader.resources["general"].textures["arrow.png"]);
    this._backwardButton.anchor.set(1,1);
    this._backwardButton.scale.set(-0.8, 0.8);
    this._backwardButton.position.set(- this._ww/2 + 10, this._hh/2 - 10);
    this.addChild(this._backwardButton);

    this._backwardButton.interactive = true;
    this._backwardButton.on('click', this.__onBackward);
    this._backwardButton.on('tap', this.__onBackward);

    this._titleText = new PIXI.Text("Title1 1", {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "40px Ubuntu",
      align: "center"
    });
    this._titleText.anchor.set(0.5);
    this._titleText.resolution = 2;
    this._titleText.position.set(
      0, this._backwardButton.position.y - this._backwardButton.height/2
    );
    this.addChild(this._titleText);

    this._slideContainer = new PIXI.Container();
    this._slideContainer.position.set(0, -this._hh/2 + (this._hh - this._forwardButton.height)/2);
    this.addChild(this._slideContainer);

    this.__getSlides(this._ww, this._hh - this._forwardButton.height);
    this.__drawSlide();

    if(isApp){
      this.scale.set(((this._hh*config.game.size)/512)/config.game.size);
    }
  }

  drawBg(width:number, height:number){
    if(isApp){
      width /= this.scale.x;
      height /= this.scale.y;
    }

    this._bg.clear();
    this._bg.beginFill(0x000000, 0.6)
      .drawRect(-width/2, -height/2, width, height)
      .endFill()
      .beginFill(0xe2e2e2, 1)
      .drawRoundedRect(-this._ww/2, -this._hh/2, this._ww, this._hh, 10)
      .endFill()
      .lineStyle(6, 0x909090, 1)
      .drawRoundedRect(-this._ww/2, -this._hh/2, this._ww, this._hh, 10);
  }

  private __getSlides(w:number, h:number){
    this._slides.push(
      new ControlSlide(w,h),
      new ActionsSlide(w,h),
      new BeanSlide(w,h),
      new GreenFartSlide(w,h),
      new RedFartSlide(w,h),
      new PowerUpStarSlide(w,h),
      new PowerUpPepperSlide(w,h),
      new PowerUpMultiSlide(w,h),
      new MedicineSlide(w,h)
    );
  }

  private __drawSlide(){
    let slide:Slide = this._slides[this._slideIndex];
    this._slideContainer.children.length = 0;
    this._titleText.text = slide.title;
    this._slideContainer.addChild(slide);
  }

  private __onForward = (evt:any)=>{
    console.log('forward');
    let len:number = this._slides.length;
    if(this._slideIndex+1 > len-1){
      this._slideIndex = 0;
    }else{
      this._slideIndex++;
    }

    this.__drawSlide();
  };

  private __onBackward = (evt:any)=>{
    console.log("backward");
    let len:number = this._slides.length;
    if(this._slideIndex-1 < 0){
      this._slideIndex = len-1;
    }else{
      this._slideIndex--;
    }

    this.__drawSlide();
  };

}

//Tutorial Slides
class Slide extends PIXI.Container {
  constructor(w:number, h:number, public title:string = ""){
    super();
  }
}

class BeanSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"Beans");

    let bean:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["general"].textures["bean2.png"]);
    bean.anchor.set(0.5);
    bean.scale.set(1.4);
    bean.position.set(0, -h/2 + 20 + bean.height/2);
    bean.tint = 0x13ef28;
    this.addChild(bean);

    let text:string = "Eat all your food to be bigger, \nstronger and stinky than anyone!";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class MedicineSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"Dark Side");

    let medicine:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["suppository.png"]);
    medicine.anchor.set(0.5);
    medicine.scale.set(1.4);
    medicine.position.set(0, -h/2 + 20 + medicine.height/2);
    this.addChild(medicine);

    let text:string = "No one wants take medicines...";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class GreenFartSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"Stinky Fart");

    let fart:DisplayFartShoot = new DisplayFartShoot();
    fart.initialize();
    fart.anchor.set(0.5);
    fart.scale.set(0.8);
    fart.position.set(0, -h/2 + 20 + fart.height/2);
    this.addChild(fart);

    let text:string = "This stinky buddy can make you a bit \nbigger, but also slower for a moment";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class RedFartSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"Fire Fart");

    let fart:DisplayFartShoot = new DisplayFartShoot();
    fart.initialize();
    fart.anchor.set(0.5);
    fart.scale.set(0.8);
    fart.position.set(0, -h/2 + 20 + fart.height/2);
    fart.tint = 0xff0000;
    this.addChild(fart);

    let text:string = "This fart is a really big deal, \ndon't touch it or you will be sick\n and lost a lot of your mass!";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class PowerUpPepperSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"PowerUp: Pepper");

    let pepper:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["Guindilla_260x260.png"]);
    pepper.anchor.set(0.5);
    pepper.scale.set(0.8);
    pepper.position.set(0, -h/2 + 20 + pepper.height/2);
    this.addChild(pepper);

    let text:string = "This adds one \"fire fart\" more \nto do funny things with it!";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class PowerUpStarSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"PowerUp: Star");

    let star1:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["starGold.png"]);
    star1.anchor.set(0.5);
    star1.scale.set(2);
    star1.position.set(0, -h/2 + 20 + star1.height/2 + 15);
    this.addChild(star1);

    star1.update = function(delta:number){
      this.rotation += 0.2*delta;
    };

    let star2:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["starGold.png"]);
    star2.anchor.set(0.5);
    star2.scale.set(2);
    star2.position.set(-star2.width/2 - 5, -h/2 + 20 + star2.height/2 + star1.height + 20);
    this.addChild(star2);

    star2.update = function(delta:number){
      this.rotation += 0.2*delta;
    };

    let star3:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["starGold.png"]);
    star3.anchor.set(0.5);
    star3.scale.set(2);
    star3.position.set(star3.width/2 + 5, -h/2 + 20 + star3.height/2 + star1.height + 20);
    this.addChild(star3);

    star3.update = function(delta:number){
      this.rotation += 0.2*delta;
    };

    let text:string = "The star give you the power of the \ninvulnerability!\n" +
      "While you're invul, you can steal \nmass from the big ones!";

    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class PowerUpMultiSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"PowerUp: Multi");

    let multi:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["nicefart1"].textures["x3.png"]);
    multi.anchor.set(0.5);
    multi.scale.set(2);
    multi.tint = 0xED5849;
    multi.position.set(0, -h/2 + 20 + multi.height/2);
    this.addChild(multi);

    let text:string = "Beans multiply their value some seconds";
    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "24px Ubuntu",
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, 40);
    this.addChild(displayText);
  }
}

class ControlSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h, isDesktop ? "Mouse" : "Mobile");

    let arrow:PIXI.Sprite = new PIXI.Sprite(PIXI.loader.resources["general"].textures["black_arrows.png"]);
    arrow.anchor.set(0.5);
    //arrow.scale.set(0.5);
    arrow.position.set(0, -h/2 + 20 + arrow.height/2);
    this.addChild(arrow);

    arrow.update = function(delta:number){
      this.rotation += 0.2*delta;
    };

    let text:string;
    let font = "24px Ubuntu";
    let posY = 40;
    if(isDesktop){
      text = "Move your mouse around the screen \nto move your Stinky Hero!";
    }else{
      posY = 65;
      font = "20px Ubuntu";
      text = "This game use the accelerometer,\n don't forget put your device in a flat position.\n\n Move your mobile to move your \nStinky Hero!";
    }

    let displayText:PIXI.Text = new PIXI.Text(text, {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: font,
      align: "center"
    });
    displayText.resolution = 2;
    displayText.anchor.set(0.5);
    displayText.position.set(0, posY);
    this.addChild(displayText);
  }
}

class ActionsSlide extends Slide {
  constructor(w:number, h:number){
    super(w,h,"Actions");
    let hh:number = h/4;

    let fastButton:FastButton = new FastButton();
    fastButton.position.set(
      -w/2 + 20 + fastButton.width/2,
      -h/2 + hh/2 + 20
    );
    fastButton.setPercent(100, false);
    this.addChild(fastButton);

    let fartButton:FartButton = new FartButton();
    fartButton.position.set(
      -w/2 + 20 + fartButton.width/2,
      -h/2 + hh + hh/2 + 30
    );
    this.addChild(fartButton);

    let pepperButton:PepperButton = new PepperButton();
    pepperButton.position.set(
      -w/2 + 20 + pepperButton.width/2,
      -h/2 + hh*2 + hh/2 + 40
    );
    pepperButton.setPeppers(3);
    this.addChild(pepperButton);

    let text1:PIXI.Text = new PIXI.Text("", {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "20px Ubuntu",
      align: "left"
    });
    text1.resolution = 2;
    text1.anchor.set(0, 0.5);
    text1.position.set(fastButton.position.x + fastButton.width/2 + 20, fastButton.position.y);
    this.addChild(text1);

    let text2:PIXI.Text = new PIXI.Text("", {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "20px Ubuntu",
      align: "left"
    });
    text2.resolution = 2;
    text2.anchor.set(0, 0.5);
    text2.position.set(fartButton.position.x + fartButton.width/2 + 20, fartButton.position.y);
    this.addChild(text2);

    let text3:PIXI.Text = new PIXI.Text("", {
      fill:0x000000,
      //stroke:"#60227a",
      //strokeThickness: 3,
      font: "20px Ubuntu",
      align: "left"
    });
    text3.resolution = 2;
    text3.anchor.set(0, 0.5);
    text3.position.set(pepperButton.position.x + pepperButton.width/2 + 20, pepperButton.position.y);
    this.addChild(text3);

    if(isDesktop){
      text1.text = "Press Q to run fast a few seconds. \nThis consume some mass but could \nsave your life!";
      text2.text = "Press W to shoot a stinky fart in \nfront of you. This consume mass \nbut it's useful to hunting...";
      text3.text = "Press E to jump and shoot a fire fart \nbehind you. This consume a lot of mass, \nbut it's extremely useful.";
    }else{
      text1.text = "Tap to run fast a few seconds. \nThis consume some mass but could \nsave your life!";
      text2.text = "Tap to shoot a stinky fart in \nfront of you. This consume mass \nbut it's useful to hunting...";
      text3.text = "Tap to jump and shoot a fire fart \nbehind you. This consume a lot of mass, \nbut it's extremely useful.";
    }

  }
}