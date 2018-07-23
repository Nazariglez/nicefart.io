///<reference path="../../typings/index.d.ts" />
///<reference path="../../typings/pixi-animationloop.d.ts" />
///<reference path="../../typings/pixi-tween.d.ts" />
///<reference path="../../typings/pixi-keyboard.d.ts" />
///<reference path="../../typings/pixi-audio.d.ts" />
///<reference path="../../node_modules/pixi-particles/ambient.d.ts" />
/*
 import all the plugins to extend pixi here.
 */
import AnimationLoopPlugin from 'pixi-animationloop';
import KeyboardPlugin from 'pixi-keyboard';
import TweenPlugin from 'pixi-tween';
import AudioPlugin from 'pixi-audio';
import * as PixiParticle from 'pixi-particles';

export default {
  AnimationLoopPlugin:AnimationLoopPlugin,
  TweenPlugin:TweenPlugin,
  KeyboardPlugin:KeyboardPlugin,
  AudioPlugin:AudioPlugin,
  PixiParticles:PixiParticle,
};