/**
 * Created by nazarigonzalez on 13/4/17.
 */
document.addEventListener("deviceready", ready);

var ADMOB_ANDROID_INTERSTITIAL = "ca-app-pub-";
var ADMOB_IOS_INTERSTITIAL = "ca-app-pub-";

function ready(){
  var script = document.createElement("script");
  script.async = true;
  script.src = "game.js";
  document.body.appendChild(script);
  //prevent sleep
  window.powermanagement.acquire();

  //prevent status bar
  AndroidFullScreen.immersiveMode();
  var autoHideNavigationBar = true;
  window.navigationbar.setUp(autoHideNavigationBar);
}
