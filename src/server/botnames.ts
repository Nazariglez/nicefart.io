/**
 * Created by nazarigonzalez on 27/6/16.
 */
import * as path from 'path';
import * as fs from 'fs';

//get names
let _botNames:string[];

export const botNames:string[] = (()=>{
  if(!_botNames){
    let names:string = fs.readFileSync(path.resolve(__dirname, '../../utils', 'botnames.txt'), 'utf-8');
    _botNames = (names.split('\n')).filter((name:string)=>(name.length <= 12));
  }
  return _botNames;
})();

export function getRandomBotName():string{
  let name:string = botNames[Math.floor(Math.random()*botNames.length)];

  //add color
  if(Math.random() < 0.15){
    const c:string = colors[Math.floor(Math.random()*colors.length)];
    name += (Math.random() < 0.4) ? `_${c}` : c;
  }else if(Math.random() < 0.15){
    const c:string = colors[Math.floor(Math.random()*colors.length)];
    name = ((Math.random() < 0.4) ? `${c}_` : c) + name;
  }

  //add camelcase
  if(Math.random() < 0.20){
    let _name:string = "";
    let up:boolean = (Math.random() < 0.5);
    for(let i:number = 0; i < name.length; i++){
      if(up){
        _name += name[i].toUpperCase();
      }else{
        _name += name[i].toLowerCase();
      }

      up = !up;
    }

    if(_name.length){
      name = _name;
    }
  }

  //add random number
  if(Math.random() < 0.15){
    const rnd:number = Math.floor(Math.random()*999);
    name += (Math.random() < 0.4) ? `_${rnd}` : rnd;
  }

  if(name.length > 12){
    return getRandomBotName();
  }

  return name;
}

const colors:string[] = [
  'Red',
  'Green',
  'Blue',
  'Yellow',
  'White',
  'Black',
  'Orange',
  'Brown',
  'Purple',
  'Pink',
  'Grey'
];
