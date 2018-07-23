/**
 * Created by nazarigonzalez on 9/6/16.
 */

//https://jwt.io/introduction/

import * as crypto from 'crypto';
const secretKey:string = "lo la le li lo lu 54 54 54 65 d 45";

export function generateAuthCredentials(user:any):authCredentials{
  //const header:any = {}

  const payloadToCypher:string = JSON.stringify({
    id: user.id,
    name: user.name,
    skin: user.skin
  });

  console.log(payloadToCypher);

  const payload:string = new Buffer(payloadToCypher).toString('base64');
  const signature:string = getSignature(user.id, payload);
  const token:string = new Buffer(payload + '.' + signature).toString("base64");

  return {
    token: token
  };
}

export function isValidAuthToken(token:string):boolean{
  const stringToken:string = Buffer.from(token, 'base64').toString('utf8');
  const data:string[] = stringToken.split(".");

  if(data.length !== 2 || !data[0] || !data[1])return false;

  const [payload, signature] = data;
  const decodedPayloadSTR:string = Buffer.from(payload, 'base64').toString('utf8');

  let decodedPayload:any;
  let invalid:boolean = false;

  try{
    decodedPayload = JSON.parse(decodedPayloadSTR);
  } catch(e){
    invalid = true;
  }

  if(invalid)return false;

  return getSignature(decodedPayload.id, payload) === signature;
}

/**
 * Use just if you trust in the token
 */
export function getPayloadFromToken(token:string):any {
  const stringToken:string = Buffer.from(token, 'base64').toString('utf8');
  const [payload, signature] = stringToken.split(".");
  
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

function getSignature(userID:string = "", payload):string{
  console.log('key', secretKey + userID);
  return crypto.createHmac('sha256', secretKey + userID)
    .update(payload)
    .digest('base64');
}

export interface authCredentials {
  token: string
}