/**
 * Created by nazarigonzalez on 24/7/16.
 */
import {customSkinConfig} from "./interfaces";

const skinColors:number[] = [
  0xFFFFFF, //sin color
  0xE3CEAE, //piel blanquita
  0xf7e6c8, //chino
  0x43310b, //negro

  0x7f5e1b, //black2

  0x22b573, //ET
  0x3399ff, //azul
  0xff99cc, //rosa
  0xcc66ff, //morado
  0xff9966, //naranja
  0xffff99, //amarillo
  0x999966, //verde raro
  0xccffff, //cyan

  0xe95fb4, //pink2
  0xe85fe9, //pink3
  0x7f5fe9, //violet2
  0x5560ef, //blue2
  0x55efc2, //cyan2
  0x55ef55, //green2
  0xbeef55, //green3
  0xf3f456, //yellow2
  0xff4949, //red

  0x430b0b, //wine
  0x43400b, //green4
  0x0b4328, //green5
  0x0b3843, //blue3
  0x120b43, //blue4
  0x430b42, //violet2
  0xff0000, //red2
  0xff8a00, //orange2
  0xf0ff00, //yellow3
];



const secondaryColors:number[] = [
  0xffffff,
  0xffce3d, 0x6c7476, 0x856dde, 0xf53e05, 0x4774d9,
  0xcbbeb5, 0xdddddd, 0x003b6f, 0xb6fcd5, 0xf3ffce,
  0x3bb9ff, 0x502c5f, 0xfa8072, 0xee82ee, 0xe52b50,
  0xd11141, 0x00b159, 0x00aedb, 0xf37735, 0xffc425,
  0xadff00, 0x74d600, 0x028900, 0x00d27f, 0x00ff83,
  0xfe0000, 0xfdfe02, 0x0bff01, 0x011efe, 0xfe00fa,
  0xe5d0ff, 0xdabcff, 0xcca3ff, 0xbf8bff, 0x2175d9,
  0x00308f, 0xe30074, 0xb8d000, 0xff9900, 0xff0000,
  0xccff00, 0x00ff66, 0x0066ff, 0xcc00ff, 0x00ff00
];

enum textureList {
  base0, nakedFemale, nakedMale, glasses, hair1, aristo, hat1,
  clown, clownHair, wizard, partyHat, partySound,
  gold, diamond, ninja1, ninja2, ninja3, ninja4, nurseMask
}

//[texturename, colored?]
const textures:any = [];
textures[textureList.base0] = ["culo_base"];
textures[textureList.nakedFemale] = ["culo_tanga_mujer"];
textures[textureList.nakedMale] = ["culo_tanga_hombre"];
textures[textureList.glasses] = ["gafas"];
textures[textureList.hair1] = ["pelo", true];
textures[textureList.hat1] = ["bombin"];
textures[textureList.aristo] = ["aristo"];
textures[textureList.clown] = ["payaso"];
textures[textureList.clownHair] = ["pelo_payaso", true];
textures[textureList.wizard] = ["potter"];
textures[textureList.partyHat] = ["fiesta"];
textures[textureList.partySound] = ["matasuegra"];
textures[textureList.gold] = ["goldass"];
textures[textureList.diamond] = ["diamondass"];
textures[textureList.ninja1] = ["ninjaass1"];
textures[textureList.ninja2] = ["ninjaass2"];
textures[textureList.ninja3] = ["ninjaass3"];
textures[textureList.ninja4] = ["ninjaass4"];
textures[textureList.nurseMask] = ["mascarilla", true];

export const basicSkin:customSkinConfig = {
  skin: {
    id: "-1",
    value: 0,
    color: 0xE3CEAE,
    secret: false,
    texture: 0 //todo remember change this if the textures names change some day
  },
  costume: null
};


export const bases:any[] = [
  [1, textureList.base0],
  [2, textureList.base0],
  [3, textureList.base0],
  [4, textureList.base0],
  [5, textureList.base0],
  [6, textureList.base0],
  [7, textureList.base0],
  [8, textureList.base0],
  [9, textureList.base0],
  [10, textureList.base0],
  [11, textureList.base0],
  [12, textureList.base0],

  [13, textureList.base0],
  [14, textureList.base0],
  [15, textureList.base0],
  [16, textureList.base0],
  [17, textureList.base0],
  [18, textureList.base0],
  [19, textureList.base0],
  [20, textureList.base0],
  [21, textureList.base0],

  [22, textureList.base0],
  [23, textureList.base0],
  [24, textureList.base0],
  [25, textureList.base0],
  [26, textureList.base0],
  [27, textureList.base0],
  [28, textureList.base0],
  [29, textureList.base0],
  [30, textureList.base0],

  [1, textureList.nakedFemale],
  [1, textureList.nakedMale],
  [2, textureList.nakedFemale],
  [2, textureList.nakedMale],
  [3, textureList.nakedFemale],
  [3, textureList.nakedMale],
  [4, textureList.nakedFemale],
  [4, textureList.nakedMale],
  [5, textureList.nakedFemale],
  [5, textureList.nakedMale],
  [6, textureList.nakedFemale],
  [6, textureList.nakedMale],
  [7, textureList.nakedFemale],
  [7, textureList.nakedMale],
  [8, textureList.nakedFemale],
  [8, textureList.nakedMale],
  [9, textureList.nakedFemale],
  [9, textureList.nakedMale],
  [10, textureList.nakedFemale],
  [10, textureList.nakedMale],
  [11, textureList.nakedFemale],
  [11, textureList.nakedMale],
  [0, textureList.gold],
  [0, textureList.diamond]
];

export const skins:any[] = [
  [], //empty
  [textureList.glasses, textureList.hair1], //terminator
  [textureList.aristo], //aristo
  [textureList.clown, textureList.clownHair], //clown
  [textureList.wizard], //wizard
  [textureList.partyHat, textureList.partySound], //party
  [textureList.nurseMask],
  [textureList.ninja1],
  [textureList.ninja2],
  [textureList.ninja3],
  [textureList.ninja4]
];

export function generateSkinConfig(base:number = 0, skin:number = 0){
  let arr:number[] = [
    bases[base][0], //base color
    bases[base][1], //base texture
    skins[skin].length * 2 //accessories length
  ];

  for(let i:number = 0; i < skins[skin].length; i++){
    arr.push(skins[skin][i]);
    if(textures[skins[skin][i]][1] === true){
      let color:number = randomColorIndex();
      arr.push(color);
    }else{
      arr.push(0);
    }
  }

  return arr;
}

export function parseSkinConfig(config:number[]){
  if(config.length < 3)return null;
  const skinColor:number = config[0];
  if(skinColor < 0 || skinColor > skinColors.length-1)return null;

  const base:number = config[1];
  if(base < 0 || base > bases.length-1)return null;

  const len:number = config[2] ? config[2]/2 : 0;
  let valid:boolean = true;
  let extras:any[] = [];

  for(let i:number = 0; i < len; i++){
    let n = (3+i*2);
    let _extra:any = {};
    if(config[n] < 0 || config[n] > textures.length-1){
      valid = false;
      break;
    }


    _extra.texture = textures[config[n]][0];

    if(config[n+1] < 0 || config[n+1] > secondaryColors.length-1){
      valid = false;
      break;
    }

    _extra.color = secondaryColors[config[n+1]];

    extras.push(_extra);
  }

  return !valid ? null : {
    color: skinColors[skinColor],
    base: textures[base],
    extras: extras
  };
}

function randomColorIndex():number{
  return Math.floor(Math.random()*secondaryColors.length);
}

export function generateRandomSkinConfig(){
  return generateSkinConfig(Math.floor(Math.random()*bases.length), Math.floor(Math.random()*skins.length));
}