/**
 * Created by nazarigonzalez on 12/7/16.
 */

import {BINARY} from "./Binary";

export interface AuthResult {
  status:string;
  data?:AuthSuccessResult;
  description?:string;
}

export interface AuthSuccessResult {
  host:string;
  token:string;
  skin:string[];
}

export enum INPUT_FLAG {
  FIRE = 1,
  FAST = 2,
  PEPPER = 4
}

export enum ACTOR_FLAG {
  SLOW = 1,
  FAST = 2,
  OUT = 4,
  CRAZY = 8,
  BURNING = 16,
  MULTI2 = 32,
  MULTI3 = 64,
  LOADING_PEPPER = 128,
  FAST_PENALTY = 256
}

export enum DEATH_BY {
  NOTHING, PLAYER, OUT, MEDICINE
}

export enum MSG_ID {
  INIT, INPUT, AUTH, WORLD, MODE, CLOSE, RANK, RADAR
}

export enum MSG_STATUS {
  SUCCESS, ERROR, INFO
}

export enum MSG_ERROR {
  InvalidAuth
}

export enum MSG_SUCCESS {
  Auth
}

export interface GameWorldState {
  time:number;
  create:any[];
  update:any[];
  remove:any[];
}

export const errorMessage:string[] = [];
errorMessage[MSG_ERROR.InvalidAuth] = "Invalid auth.";

export const successMessage:string[] = [];
successMessage[MSG_SUCCESS.Auth] = "Successfully auth.";

export function getErrorMessage(id:number|MSG_ERROR):string{
  return errorMessage[id];
}

export function getSuccessMessage(id:number|MSG_SUCCESS):string{
  return successMessage[id];
}

export enum ENTITY_TYPE {
  ACTOR, FART_SHOOT, MEDICINE, FOOD, POWER_UP, MISC
}

export enum UPDATE_CODE {
  CREATE, REMOVE, UPDATE
}

export declare type INPUT_VALUES = [
    MSG_ID,
    number, //angle
    number, //force
    number //flags
  ];

export declare type ACTOR_DATA = [
    number, //id
    ENTITY_TYPE, //type
    string, //name
    number, //x
    number, //y
    number, //radius
    number, //mass
    number, //flags
    number, //crazy time
    number, //peppers
    number, //fastPercent
    any[] //skin
  ];

export const ACTOR_BINARY:BINARY[] = [
  BINARY.UInt16, //id
  BINARY.UInt8, //type
  BINARY.String, //name
  BINARY.Int16, //x
  BINARY.Int16, //y
  BINARY.UInt16, //radius
  BINARY.UInt32, //mass
  BINARY.UInt16, //flags
  BINARY.UInt16, //crazyTime
  BINARY.UInt8, //peppers
  BINARY.UInt8 //fastPercent
];

export declare type CREATE_ACTOR = [
  UPDATE_CODE,
  number, //id
  ENTITY_TYPE, //type
  string, //name
  number, //x
  number, //y
  number, //radius
  number, //mass
  number, //flags
  number, //crazytime
  any[] //skin
  ];

export declare type UPDATE_ACTOR = [
  UPDATE_CODE,
  number, //id
  number, //x
  number, //y
  number, //radius
  number, //mass
  number, //flags
  number //crazyTime
  ];

export declare type REMOVE_ACTOR = [
  UPDATE_CODE,
  number, //id
  number //assasin id
  ]

export declare type FOOD_DATA = [
    number, //id
    ENTITY_TYPE, //type
    number, //mass
    number, //x
    number, //y
    number //radius
  ];

export const FOOD_BINARY:BINARY[] = [
  BINARY.UInt16,
  BINARY.UInt8,
  BINARY.UInt16,
  BINARY.Int16,
  BINARY.Int16,
  BINARY.UInt16
];

export declare type CREATE_FOOD = [
  UPDATE_CODE,
  number, //id
  ENTITY_TYPE, //type
  number, //mass
  number, //x
  number, //y
  number //radius
  ];

export declare type UPDATE_FOOD = [
  UPDATE_CODE,
  number, //id,
  number, //x
  number //y
  ];

export declare type REMOVE_FOOD = [
  UPDATE_CODE,
  number, //id,
  number //assasin id
  ];

export declare type FART_SHOOT_DATA = [
  number, //id
  ENTITY_TYPE, //type
  number, //mass
  number, //x
  number, //y
  number, //radius
  number //owner
  ];

export const FART_SHOOT_BINARY:BINARY[] = [
  BINARY.UInt16,
  BINARY.UInt8,
  BINARY.UInt16,
  BINARY.Int16,
  BINARY.Int16,
  BINARY.UInt16,
  BINARY.UInt16,
  BINARY.UInt8
];

export declare type CREATE_FART_SHOOT = [
  UPDATE_CODE,
  number, //id
  ENTITY_TYPE, //type
  number, //mass
  number, //x
  number, //y
  number //radius
  ];

export declare type UPDATE_FART_SHOOT = [
  UPDATE_CODE,
  number, //id,
  number, //x
  number //y
  ];

export declare type REMOVE_FART_SHOOT = [
  UPDATE_CODE,
  number, //id
  number //victim id
  ];

export declare type POWER_UP_DATA = [
    number, //id
    ENTITY_TYPE, //type
    number, //x
    number, //y
    number //radius
  ];

export const POWER_UP_BINARY:BINARY[] = [
  BINARY.UInt16,
  BINARY.UInt8,
  BINARY.Int16,
  BINARY.Int16,
  BINARY.UInt16,
  BINARY.UInt8
];

export declare type CREATE_POWER_UP = [
  UPDATE_CODE,
  number, //id
  ENTITY_TYPE, //type
  number, //x
  number, //y
  number //radius
  ];

export declare type UPDATE_POWER_UP = [
  UPDATE_CODE,
  number, //id
  number, //x
  number //y
  ];

export declare type REMOVE_POWER_UP = [
  UPDATE_CODE,
  number, //id
  number //player id
  ];

export declare type MEDICINE_DATA = [
  number, //id
  ENTITY_TYPE, //type
  number, //angle
  number, //x
  number, //y
  number //radius
  ];

export const MEDICINE_BINARY:BINARY[] = [
  BINARY.UInt16,
  BINARY.UInt8,
  BINARY.Int16,
  BINARY.Int16,
  BINARY.Int16,
  BINARY.UInt16
];

export declare type CREATE_MEDICINE = [
  UPDATE_CODE,
  number, //id
  ENTITY_TYPE, //type
  number, //angle
  number, //x
  number, //y
  number //radius
  ];

export declare type UPDATE_MEDICINE = [
  UPDATE_CODE,
  number, //id
  number, //angle
  number, //x
  number //y
  ];

export declare type REMOVE_MEDICINE = [
  UPDATE_CODE,
  number, //id
  number //assasins id
  ];

export interface skinConfig {
  id:string;
  value:number;
  color:number;
  texture:number;
  secret:boolean;
}

export interface costumeConfig {
  id:string;
  value:number;
  textures:number[][];
  secret:boolean;
}

export interface skinsInfo {
  textures:string[];
  skins:skinConfig[];
  costumes:costumeConfig[];
}

export interface customSkinConfig {
  skin:skinConfig;
  costume:costumeConfig;
}