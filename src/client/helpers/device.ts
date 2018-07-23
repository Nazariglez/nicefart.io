/**
 * Created by nazarigonzalez on 12/1/17.
 */
export let userAgent:string = 'navigator' in window && 'userAgent' in navigator && navigator.userAgent.toLowerCase() || '';
export let vendor:string = 'navigator' in window && 'vendor' in navigator && navigator.vendor.toLowerCase() || '';
export let appVersion:string = 'navigator' in window && 'appVersion' in navigator && navigator.appVersion.toLowerCase() || '';

export let isChrome:boolean = /chrome|chromium/i.test(userAgent) && /google inc/.test(vendor);
export let isFirefox = /firefox/i.test(userAgent);
export let isIE = /msie/i.test(userAgent) || "ActiveXObject" in window;
export let isOpera = /^Opera\//.test(userAgent) || /\x20OPR\//.test(userAgent);
export let isSafari = /safari/i.test(userAgent) && /apple computer/i.test(vendor);

export let isIphone = /iphone/i.test(userAgent);
export let isIpad = /ipad/i.test(userAgent);
export let isIpod = /ipod/i.test(userAgent);
export let isAndroid = /android/i.test(userAgent);
export let isAndroidPhone = /android/i.test(userAgent) && /mobile/i.test(userAgent);
export let isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
export let isLinux = /linux/i.test(appVersion);
export let isMac = /mac/i.test(appVersion);
export let isWindow = /win/i.test(appVersion);
export let isWindowPhone = isWindow && /phone/i.test(userAgent);
export let isWindowTablet = isWindow && !isWindowPhone && /touch/i.test(userAgent);
export let isMobile = isIphone || isIpod|| isAndroidPhone || isWindowPhone;
export let isTablet = isIpad || isAndroidTablet || isWindowTablet;
export let isDesktop = !isMobile && !isTablet;
export let isTouchDevice = 'ontouchstart' in window ||'DocumentTouch' in window;
export let isCocoon = !!(navigator as any).isCocoonJS;
export let isNodeWebkit = !!(typeof process === "object" && process.title === "node" && typeof global === "object");
export let isEjecta = !!(window as any).ejecta;
export let isCrosswalk = /Crosswalk/.test(userAgent);
export let isCordova = !!(window as any).cordova;
export let isElectron = !!(process && process.versions && ((process.versions as any).electron || process.versions['atom-shell']));
export let isApp = isCordova||isCocoon;

export let hasVibrate = !!navigator.vibrate && (isMobile || isTablet);
export let hasMouseWheel = 'onwheel' in window || 'onmousewheel' in window || 'MouseScrollEvent' in window;
export let hasAccelerometer = 'DeviceMotionEvent' in window;
export let hasGamepad = !!navigator.getGamepads || !!(navigator as any).webkitGetGamepads;

let div = document.createElement('div') as HTMLDivElement;
export let fullScreenRequest = div.requestFullscreen || div.webkitRequestFullScreen || (div as any).msRequestFullScreen || (div as any).mozRequestFullScreen;
export let fullScreenCancel = (document as any).cancelFullScreen || (document as any).exitFullScreen || (document as any).webkitCancelFullScreen || (document as any).msCancelFullScreen || (document as any).mozCancelFullScreen;
export let hasFullScreen = !!(fullScreenRequest && fullScreenCancel);

export function vibrate(value:number){
  if(hasVibrate){
    navigator.vibrate(value);
  }
}

let s = window.screen as any;
let lockOrientationVendor = s.lockOrientation || s.mozLockOrientation || s.msLockOrientation;

export function lockOrientation(orientation:string) : boolean {
  if(isDesktop || !lockOrientationVendor)return false;
  return lockOrientationVendor(orientation);
}

export function lockLandscape() : boolean {
  return lockOrientation("landscape-primary");
}

export function lockPortrait() : boolean {
  return lockOrientation("portrait-primary");
}

export let browserAds = false;
export let mobileAds = false;
if(!isCocoon&&!isCordova){
  /*let req = new XMLHttpRequest();
  req.open("GET", "/assets/adBlock.js");
  req.onload = function onLoad(){
    console.log('Ads loaded...');
    if(req.status === 200){
      browserAds = true;
    }
  };
  req.onerror = function onError(){
    browserAds = false;
  };

  req.send();*/
}else if(isAndroid){
  //todo check adblock on android (adblock plus) https://www.youtube.com/watch?v=-f9gOQsgrbw
}

export function canDisplayAds(){
  return (isCordova||isCocoon) ? mobileAds : browserAds;
}

(window as any).canDisplayAds = canDisplayAds; //todo remove