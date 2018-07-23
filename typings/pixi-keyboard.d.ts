declare module PIXI {
  export module keyboard {
    export class KeyboardManager extends EventEmitter{
      constructor();
      isEnabled:boolean;
      enable():void;
      disable():void;
      setPreventDefault(key:number, value?:boolean):void;
      isDown(key:number):boolean;
      isPressed(key:number):boolean;
      isReleased(key:number):boolean;
      update():void;
      getHotKey(key:number):HotKey;
      removeHotKey(key:HotKey):void;
    }

    export class HotKey{
      constructor(key:number, manager:KeyboardManager);
      key:number;
      isDown:boolean;
      isPressed:boolean;
      isReleased:boolean;
      ctrl:boolean;
      shift:boolean;
      alt:boolean;
      remove():void;
    }

    export class Key{
      static BACKSPACE:number;
      static TAB:number;
      static ENTER:number;
      static SHIFT:number;
      static PAUSE:number;
      static CTRL:number;
      static ALT:number;
      static CAPS_LOCK:number;
      static ESCAPE:number;
      static SPACE:number;
      static PAGE_UP:number;
      static PAGE_DOWN:number;
      static END:number;
      static HOME:number;
      static LEFT:number;
      static UP:number;
      static RIGHT:number;
      static DOWN:number;
      static PRINT_SCREEN:number;
      static INSERT:number;
      static DELETE:number;
      static _0:number;
      static _1:number;
      static _2:number;
      static _3:number;
      static _4:number;
      static _5:number;
      static _6:number;
      static _7:number;
      static _8:number;
      static _9:number;
      static A:number;
      static B:number;
      static C:number;
      static D:number;
      static E:number;
      static F:number;
      static G:number;
      static H:number;
      static I:number;
      static J:number;
      static K:number;
      static L:number;
      static M:number;
      static N:number;
      static O:number;
      static P:number;
      static Q:number;
      static R:number;
      static S:number;
      static T:number;
      static U:number;
      static V:number;
      static W:number;
      static X:number;
      static Y:number;
      static Z:number;
      static CMD:number;
      static CMD_RIGHT:number;
      static NUM_0:number;
      static NUM_1:number;
      static NUM_2:number;
      static NUM_3:number;
      static NUM_4:number;
      static NUM_5:number;
      static NUM_6:number;
      static NUM_7:number;
      static NUM_8:number;
      static NUM_9:number;
      static MULTIPLY:number;
      static ADD:number;
      static SUBTRACT:number;
      static DECIMAL_POINT:number;
      static DIVIDE:number;
      static F1:number;
      static F2:number;
      static F3:number;
      static F4:number;
      static F5:number;
      static F6:number;
      static F7:number;
      static F8:number;
      static F9:number;
      static F10:number;
      static F11:number;
      static F12:number;
      static NUM_LOCK:number;
      static SCROLL_LOCK:number;
      static SEMI_COLON:number;
      static EQUAL:number;
      static COMMA:number;
      static DASH:number;
      static PERIOD:number;
      static FORWARD_SLASH:number;
      static OPEN_BRACKET:number;
      static BLACK_SLASH:number;
      static CLOSE_BRACKET:number;
      static SINGLE_QUOTE:number;
    }
  }

  export let keyboardManager:keyboard.KeyboardManager;
}

declare module 'pixi-keyboard' {
  export default PIXI.keyboard;
}
