/**
 * Created by nazarigonzalez on 18/7/16.
 */
import AbstractScene from "./AbstractScene";
import Game from "../Game";
import DisplayTransition from "../actors/DisplayTransition";
import ButtonSkinSelector from "../actors/ButtonSkinSelector";
import FinalMenu from "../actors/FinalMenu";
import {Particle} from "../actors/Particle";
import {isMobile, isDesktop, canDisplayAds} from "../helpers/device";
import {fartActorEffect} from "../helpers/particles";
import HelpButton from "../actors/HelpButton";
import Tutorial from "../actors/Tutorial";
import DisplayAudioButton from "../actors/DisplayAudioButton";
import UIBlock from "../actors/UIBlock";
import UIButton from "../actors/UIButton";

const title:string = "BeanWar.io";

export default class MainScene extends AbstractScene {
  private _bg:PIXI.extras.TilingSprite;
  private _initialized:boolean = false;
  private _logo:PIXI.Container = new PIXI.Container();
  private _transition:DisplayTransition;
  private _skinBtn:ButtonSkinSelector;
  private _finalMenu:FinalMenu;
  private _helpButton:HelpButton;
  private _tutorial:Tutorial;
  private _tutorialText:PIXI.Text;
  private _tutorialTween:PIXI.tween.Tween;
  private _audioButton:DisplayAudioButton;
  private _logoScale:boolean = true;
  private _container:PIXI.Container = new PIXI.Container();
  private _loginBox:HTMLDivElement = document.querySelector("div#loginBox") as HTMLDivElement;

  background:PIXI.extras.TilingSprite;

  constructor(public game:Game){
    super(game);

    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background = new PIXI.extras.TilingSprite(PIXI.loader.resources["tileBack"].texture, max, max);
    this.background.tileScale.set(this._internalScale/this.background.scale.x);//this.background.pivot.set(this.background.width/2, this.background.height/2);
    this.background.anchor.set(0.5);
    this.background.tint = 0xf0f0f0;

    (window as any).bg = this.background;

    this.addChildAt(this.background, 0);
    this.ui.addChild(this._container);




    /*let logo = new PIXI.Sprite(PIXI.loader.resources["nicefartLogo"].texture);
    logo.anchor.set(0.5);
    //logo.position.set(0, -150);
    logo.tint = 0xffffff;
    logo.scale.set(1.2);*/
    let logo = new PIXI.Text(title, {
      fill:"#6db967",
      stroke:"#000000",
      strokeThickness: 6,
      font: "60px Ubuntu",
      align: "center"
    });
    logo.anchor.set(0.5);
    logo.resolution = 2;

    this._logo.addChild(logo);

    const shadow = new PIXI.filters.DropShadowFilter();
    console.log(shadow.distance);
    if(isMobile){
      shadow.distance = 5;
    }
    logo.filters = [shadow];

    this._bg = new PIXI.extras.TilingSprite(PIXI.loader.resources["clouds"].texture, logo.width, logo.height);
    this._bg.anchor.set(0.5);
    this._bg.position.copy(logo.position);
    this._bg.tint = 0xffffff;
    //this._bg.tint = 0x1BFF70;
    //this._bg.tint = 0x00f0ff;
    this._bg.alpha = 0.8;
    this._bg.tileScale.set(2);
    this._logo.addChild(this._bg);

    /*let logo2 = new PIXI.Sprite(PIXI.loader.resources["nicefartLogo"].texture);
    logo2.anchor.set(0.5);
    logo2.tint = 0xffffff;
    logo2.scale.set(1.2);

    this._logo.addChild(logo2);
    this._bg.mask = logo2;*/

    let logo2 = new PIXI.Text(title, {
      fill:"#ffffff",
      stroke:"#000000",
      strokeThickness: 6,
      font: "60px Ubuntu",
      align: "center"
    });
    logo2.anchor.set(0.5);
    logo2.resolution = 2;
    this._logo.addChild(logo2);
    this._bg.mask = logo2;

    this.ui.addChild(this._logo);

    this._logo.position.set(0, /*-(this._renderer.height/2)/this.ui.scale.y + 50*/-120);
    this._logo.scale.set(0);

    let leftContainer = new UIBlock(100, 150);
    leftContainer.position.x = -155;

    let contactButton = new UIButton("Contact", 90, 20);
    contactButton.position.y = -leftContainer.height/2 + leftContainer.height/6;
    contactButton.onClick = ()=>{
      this.game.triggerHash("#contact");
    };
    contactButton.disabledColor = 0x3b9192;
    contactButton.draw();
    leftContainer.addChild(contactButton);

    let tarentoladButton = new UIButton("@TarentolaD", 90, 20);
    tarentoladButton.position.y = -leftContainer.height/2 + (leftContainer.height/6)*2;
    tarentoladButton.onClick = ()=>{
      window.open("https://twitter.com/TarentolaD", "_blank");
    };
    tarentoladButton.disabledColor = 0x3b9192;
    tarentoladButton.draw();
    leftContainer.addChild(tarentoladButton);

    let logButton = new UIButton("Changelog", 90, 20);
    logButton.position.y = -leftContainer.height/2 + (leftContainer.height/6) * 3;
    logButton.onClick = ()=>{
      this.game.triggerHash("#changelog");
    };
    logButton.disabledColor = 0x3b9192;
    logButton.draw();
    leftContainer.addChild(logButton);

    let privacyButton = new UIButton("Privacy", 90, 20);
    privacyButton.position.y = -leftContainer.height/2 + (leftContainer.height/6)*4;
    privacyButton.onClick = ()=>{
      this.game.triggerHash("#privacy");
    };
    privacyButton.disabledColor = 0x3b9192;
    privacyButton.draw();
    leftContainer.addChild(privacyButton);

    let iogamesButton = new UIButton("IO Games", 90, 20);
    iogamesButton.position.y = -leftContainer.height/2 + (leftContainer.height/6)*5;
    iogamesButton.onClick = ()=>{
      window.open("http://iogames.space", "_blank");
    };
    iogamesButton.disabledColor = 0x3b9192;
    iogamesButton.draw();
    leftContainer.addChild(iogamesButton);

    let rightContainer = new UIBlock(100, 150);
    rightContainer.position.x = +155;
    let centerContainer = new UIBlock(200, 150);

    let leaderboardButton = new UIButton("Leaderboard", 90, 20);
    leaderboardButton.position.y = -rightContainer.height/2 + (rightContainer.height/6);
    leaderboardButton.onClick = ()=>{
      window.open("/leaderboard", "_blank");
    };
    leaderboardButton.disabledColor = 0x61a8ff;
    leaderboardButton.color = 0x2871ff;
    leaderboardButton.draw();
    rightContainer.addChild(leaderboardButton);

    let shopButton = new UIButton("Skins", 90, 20);
    shopButton.position.y = -rightContainer.height/2 + (rightContainer.height/6) * 2;
    shopButton.onClick = ()=>{
      if(this._skinBtn){
        this._skinBtn.onClick(null);
      }
    };
    shopButton.disabledColor = 0xb6ca65;
    shopButton.color = 0xfff949;
    shopButton.draw();
    rightContainer.addChild(shopButton);

    let enterButton = new UIButton("Play", 90, 20);
    enterButton.position.y = -15;
    enterButton.position.x = enterButton.width*0.5 + 2;
    enterButton.onClick = ()=>{
      this.game.tryLogin();
    };
    enterButton.disabledColor = 0x476bca;
    enterButton.color = 0x3b6cee;
    enterButton.draw();
    centerContainer.addChild(enterButton);

    let tutorialButton = new UIButton("Tutorial", 90, 20);
    tutorialButton.position.y = -15;
    tutorialButton.position.x = -(tutorialButton.width*0.5 + 2);
    tutorialButton.onClick = ()=>{
      if(this._tutorial.visible){
        this.openTutorial(false);
      }else{
        this.openTutorial();
      }
    };
    tutorialButton.disabledColor = 0xb6b78d;
    tutorialButton.color = 0xebd451;
    tutorialButton.draw();
    centerContainer.addChild(tutorialButton);

    this._container.addChild(centerContainer);
    this._container.addChild(leftContainer);
    this._container.addChild(rightContainer);

    this._skinBtn = new ButtonSkinSelector(this.game);
    this._skinBtn.width = this._skinBtn.height = 100;
    let ww:number = this._skinBtn.width * (isDesktop ? 0.5 : 0.7) / this._skinBtn.scale.x;
    this._skinBtn.hitArea = new PIXI.Rectangle(-ww, -ww, ww*2, ww*2);
    //this._skinBtn.anchor.set(1);
    /*this._skinBtn.position.set(
     (this._renderer.width/2)/this.ui.scale.x - 10 - this._skinBtn.width/2,
     (this._renderer.height/2)/this.ui.scale.y - 10 - this._skinBtn.height/2
     );*/
    this._skinBtn.position.y = -rightContainer.height/2 + (rightContainer.height/6) * 4 + 10;
    this._skinBtn.scale.set(0.3);
    //this._skinBtn.visible = false;
    rightContainer.addChild(this._skinBtn);

    this._tutorial = new Tutorial();
    this.ui.addChild(this._tutorial);
    this._tutorial.drawBg(this._renderer.width/this.ui.scale.x, this._renderer.height/this.ui.scale.y);
    this._tutorial.visible = false;

    this._helpButton = new HelpButton();
    this._helpButton.visible = false;
    this._helpButton.anchor.set(0, 1);
    this._helpButton.position.set(
      -(this._renderer.width/2)/this.ui.scale.x + 10,
      (this._renderer.height/2)/this.ui.scale.y - 6
    );
    this.ui.addChild(this._helpButton);

    this._helpButton.onClick = ()=>{
      if(this._tutorial.visible){
        this.openTutorial(false);
      }else{
        this.openTutorial();
      }
    };

    this._audioButton = new DisplayAudioButton();
    this._audioButton.anchor.set(0,1);
    this._audioButton.scale.set(0.6);
    if(this.game.user.music){
      this._audioButton.enable();
    }else{
      this._audioButton.disable();
    }

    this._audioButton.onToggle = (status:boolean)=>{
      this.game.toggleAudio();
    };

    this._audioButton.position.set(
      this._helpButton.x + 4,
      this._helpButton.y - this._helpButton.height
    );

    this.ui.addChild(this._audioButton);


    if(this.game.user.firstTime){
      this._tutorialText = new PIXI.Text("<- TUTORIAL", {
        fill:"#fff987",
        stroke:"#000000",
        strokeThickness: 6,
        font: "28px Ubuntu",
        align: "center"
      });
      this._tutorialText.visible = false;
      this._tutorialText.anchor.set(0, 1);
      this._tutorialText.position.set(
        this._helpButton.position.x + this._helpButton.width,
        this._helpButton.position.y
      );
      this.ui.addChild(this._tutorialText);

      this._tutorialTween = this.tweenManager.createTween(this._tutorialText);
      this._tutorialTween.from({
        alpha: 1
      });
      this._tutorialTween.to({
        alpha: 0
      });
      this._tutorialTween.delay = 1000;
      this._tutorialTween.pingPong = true;
      this._tutorialTween.repeat = 30;
      this._tutorialTween.time = 1300;
    }

    this._transition = new DisplayTransition(this);
    this._transition.visible = false;
    this._transition.interactive = true;
    this.ui.addChild(this._transition);

    this._finalMenu = new FinalMenu(this);
    this.ui.addChild(this._finalMenu);

    let tween1:PIXI.tween.Tween = this.tweenManager.createTween(this._logo);
    tween1.easing = PIXI.tween.Easing.outElastic();
    tween1.time = 4000;
    tween1.from({
      scale: {x:0, y:0}
    });
    tween1.to({
      scale: {x:1, y:1}
    });
    tween1.start();

    let tween2:PIXI.tween.Tween = this.tweenManager.createTween(this._logo);
    tween2.easing = PIXI.tween.Easing.outBack();
    tween2.time = 1200;
    tween2.from({
      y: -this._renderer.height
    });
    tween2.to({
      y:  /*-(this._renderer.height/2)/this.ui.scale.y + 50*/-120
    });
    tween2.start();
    tween1.on('end', ()=>{
      //this._skinBtn.visible = true;
      this.hideSkins(!this.game.user.share);
      this._helpButton.visible = true;
      if(this._tutorialText){
        this._tutorialText.visible = true;
        this._tutorialTween.start();
      }
      game.firstInit();
    });

    this._initialized = true;

    //this._xxx.style.left = window.innerWidth/2 + "px";
    //this._xxx.style.top = window.innerHeight/2 + "px";
    this.resizeLoginInput();
  }

  hideLogin(value:boolean = true){
    this._loginBox.style.display = value ? "none" : "block";
  }

  hideSkins(value:boolean = true) {
    this._skinBtn.visible = !value;
  }

  onCloseFinalMenu(){}

  addSkinSelectorCallback(cb:(evt:any)=>void){
    this._skinBtn.onClick = cb;
  }

  init(time:number = 200){
    let tween:PIXI.tween.Tween = this.tweenManager.createTween(this._bg);
    tween.expire = true;
    tween.from({
      alpha: 0
    });
    tween.to({
      alpha: 1
    });
    tween.time = time;
    tween.start();
  }

  drawSkin(){
    this._skinBtn.drawSkin();
  }

  openTutorial(open:boolean = true){
    let loginDiv:HTMLDivElement = document.body.querySelector("div#login") as HTMLDivElement;

    if(open){
      this.hideLogin();
      loginDiv.style.display = "none";
      this._tutorial.visible = true;
      this._tutorial.interactive = true;
      this._helpButton.setText(" x");
      (this.game as any).__hideAdsBlock(true);
    }else{
      this.hideLogin(false);
      this._tutorial.interactive = false;
      this._tutorial.visible = false;
      loginDiv.style.display = "block";
      this._helpButton.setText();
      (this.game as any).__hideAdsBlock(false);
    }

    if(this._tutorialText){
      this._tutorialTween.stop();
      this._tutorialText.alpha = 0;
    }

  }

  transition(open:boolean = true, cb?:()=>void){
    this._transition.visible = true;
    this._transition.close(700, cb);
  }

  openFinalMenu(data:any, cb?:()=>void){
    let loginDiv:HTMLDivElement = document.body.querySelector("div#login") as HTMLDivElement;
    loginDiv.style.display = "none";

    if(data){
      this._finalMenu.setData(data)
    }

    this._transition.showBg();
    this._transition.visible = true;
    this._finalMenu.onCloseClick = this.onCloseFinalMenu;
    this._finalMenu.open(cb);
  }

  closeFinalMenu(cb?:()=>void){
    this._finalMenu.close(()=>{
      this.transition(false, cb);
    });
  }

  update(delta:number){
    super.update(delta);
    this.background.tilePosition.x += 30*delta;
    this._bg.tilePosition.x += (20+Math.random()*10)*delta;
    this._bg.tilePosition.y -= (20+Math.random()*10)*delta;
    /*let d:number = 0.1*delta;
    if(this._logoScale){
      this._bg.tileScale.x -= d;
      this._bg.tileScale.y -= d;

      if(this._bg.tileScale.x < 0.8){
        this._logoScale = false;
      }
    }else{
      this._bg.tileScale.x += d;
      this._bg.tileScale.y += d;

      if(this._bg.tileScale.x > 1.8){
        this._logoScale = true;
      }
    }*/
  }

  resizeLoginInput(){
    this._loginBox.style.left = (window.innerWidth/2 - 100*this.ui.scale.x) + "px";
    this._loginBox.style.top = (window.innerHeight/2 - 70*this.ui.scale.y) + "px";

    let strScale = (`rotate(0) scale(${this.ui.scale.x}) skewX(0) skewY(0)`);
    let elements = [this._loginBox];
    (elements as any[]).forEach((element)=>{
      element.style.transformOrigin = "top left";
      element.style.webkitTransformOrigin = "top left";
      element.style.transform = strScale;
      element.style.webkitTransform = strScale;
      element.style.MozTransform = strScale;
      element.style.msTransform = strScale;
      element.style.OTransform = strScale;
      element.style.transform = strScale;
    });
  }

  onResizeWindow(){
    super.onResizeWindow();
    if(!this._initialized)return;
    this._logo.position.set(0, /*-(this._renderer.height/2)/this.ui.scale.y + 50*/-120);

    const max:number = Math.max(this._renderer.width, this._renderer.height);
    this.background.scale.set(max/this.background.width);
    this.background.tileScale.set(this._internalScale/this.background.scale.x);

    this.resizeLoginInput();

    /*this._skinBtn.position.set(
      (this._renderer.width/2)/this.ui.scale.x - 10 - this._skinBtn.width/2,
      (this._renderer.height/2)/this.ui.scale.y - 10 - this._skinBtn.height/2
    );*/

    if(this._helpButton){
      this._helpButton.position.set(
        -(this._renderer.width/2)/this.ui.scale.x + 10,
        (this._renderer.height/2)/this.ui.scale.y - 6
      );
    }

    if(this._tutorialText){
      this._tutorialText.position.set(
        this._helpButton.position.x + this._helpButton.width,
        this._helpButton.position.y
      );
    }

    if(this._audioButton){
      this._audioButton.position.set(
        this._helpButton.x + 4,
        this._helpButton.y - this._helpButton.height
      );
    }

    this._tutorial.drawBg(this._renderer.width/this.ui.scale.x, this._renderer.height/this.ui.scale.y);

    if(this._transition.opened){
      this._transition.showBg();
    }else{
      this._transition.outPosition();
    }
  }

  get isTutorialOpen():boolean {
    return this._tutorial.visible;
  }
}