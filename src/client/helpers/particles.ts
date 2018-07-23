/**
 * Created by nazarigonzalez on 28/1/17.
 */

export const fartActorEffect = {
  "alpha": {
    "start": 0.74,
    "end": 0
  },
  "scale": {
    "start": 5,
    "end": 1,
    "minimumScaleMultiplier": 1
  },
  "color": {
    "start": "#05ff1a",
    "end": "#cef0c9"
  },
  "speed": {
    "start": 150,
    "end": 0,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 0,
    "max": 360
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 200
  },
  "lifetime": {
    "min": 0.5,
    "max": 1
  },
  "blendMode": "normal",
  "ease": [
    {
      "s": 0,
      "cp": 0.329,
      "e": 0.548
    },
    {
      "s": 0.548,
      "cp": 0.767,
      "e": 0.876
    },
    {
      "s": 0.876,
      "cp": 0.985,
      "e": 1
    }
  ],
  "frequency": 0.001,
  "emitterLifetime": 0.1,
  "maxParticles": 25,
  "pos": {
    "x": 0,
    "y": 0
  },
  "addAtBack": false,
  "spawnType": "point"
};

export const fartButtonEffect = {
  "alpha": {
    "start": 0.32,
    "end": 0
  },
  "scale": {
    "start": 2,
    "end": 0.8,
    "minimumScaleMultiplier": 1
  },
  "color": {
    "start": "#20e016",
    //"start": "#e00900",
    "end": "#57ff81"
    //"end": "#ff5c50"
  },
  "speed": {
    "start": 4,
    "end": 1,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 0,
    "max": 360
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 0
  },
  "lifetime": {
    "min": 1,
    "max": 3
  },
  "blendMode": "normal",
  "frequency": 0.03,
  "emitterLifetime": -1,
  "maxParticles": 100,
  "pos": {
    "x": 0.5,
    "y": 0.5
  },
  "addAtBack": false,
  "spawnType": "circle",
  "spawnCircle": {
    "x": 0,
    "y": 0,
    "r": 30
  }
};

export const fastButtonEffect = {
  alpha: {
    start: 0.8,
    end: 0.1
  },
  scale: {
    start: 3,
    end: 1
  },
  color: {
    start: "ffffff",
    end: "ffffff"
  },
  speed: {
    start: 40,
    end: 18
  },
  startRotation: {
    min: 0,
    max: 360
  },
  rotationSpeed: {
    min: 0,
    max: 0
  },
  lifetime: {
    min: 0.5,
    max: 2
  },
  frequency: 0.12,
  emitterLifetime: -1,
  maxParticles: 100,
  pos: {
    x: 0,
    y: 0
  },
  addAtBack: false,
  spawnType: "circle",
  spawnCircle: {
    x: 0,
    y: 0,
    r: 10
  }
};

export const pepperButtonEffect = {
  "alpha": {
    "start": 0.32,
    "end": 0
  },
  "scale": {
    "start": 2,
    "end": 0.8,
    "minimumScaleMultiplier": 1
  },
  "color": {
    //"start": "#20e016",
    "start": "#e00900",
    //"end": "#57ff81"
    "end": "#ff5c50"
  },
  "speed": {
    "start": 4,
    "end": 1,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 0,
    "max": 360
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 0
  },
  "lifetime": {
    "min": 1,
    "max": 3
  },
  "blendMode": "normal",
  "frequency": 0.03,
  "emitterLifetime": -1,
  "maxParticles": 100,
  "pos": {
    "x": 0.5,
    "y": 0.5
  },
  "addAtBack": false,
  "spawnType": "circle",
  "spawnCircle": {
    "x": 0,
    "y": 0,
    "r": 30
  }
};

export const fastActorEffect = {
  alpha: {
    start: 0.7,
    end: 0
  },
  scale: {
    start: 1.5,
    end: 0.6
  },
  color: {
    start: "#ffffff",
    end: "#ffffff"
  },
  speed: {
    start: 60,
    end: 20
  },
  startRotation: {
    min: 0,
    max: 360
  },
  rotationSpeed: {
    min: 0,
    max: 0
  },
  lifetime: {
    min: 0.5,
    max: 1
  },
  frequency: 0.18,
  emitterLifetime: -1,
  maxParticles: 100,
  pos: {
    x: 0,
    y: 0
  },
  addAtBack: false,
  spawnType: "circle",
  spawnCircle: {
    x: 0,
    y: 0,
    r: 30
  }
};

export const pepperLoadingActorEffect = {
  alpha: {
    start: 0.7,
    end: 0
  },
  scale: {
    start: 2.5,
    end: 0.8
  },
  color: {
    start: "#ff0000",
    end: "#a22310"
  },
  speed: {
    start: 80,
    end: 40
  },
  startRotation: {
    min: 0,
    max: 360
  },
  rotationSpeed: {
    min: 0,
    max: 0
  },
  lifetime: {
    min: 0.5,
    max: 1
  },
  frequency: 0.12,
  emitterLifetime: -1,
  maxParticles: 100,
  pos: {
    x: 0,
    y: 0
  },
  addAtBack: false,
  spawnType: "circle",
  spawnCircle: {
    x: 0,
    y: 0,
    r: 40
  }
};

export const burningActorEffect = {
  "alpha": {
    "start": 0.4,
    "end": 0
  },
  "scale": {
    "start": 10,
    "end": 15,
    "minimumScaleMultiplier": 1
  },
  "color": {
    "start": "#ffff00",
    "end": "#ff2929"
  },
  "speed": {
    "start": 350,
    "end": 0,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 0,
    "max": 360
  },
  "noRotation": true,
  "rotationSpeed": {
    "min": 0,
    "max": 0
  },
  "lifetime": {
    "min": 0.75,
    "max": 1.5
  },
  "blendMode": "normal",
  "frequency": 0.02,
  "emitterLifetime": -1,
  "maxParticles": 1000,
  "pos": {
    "x": 0,
    "y": 0
  },
  "addAtBack": false,
  "spawnType": "circle",
  "spawnCircle": {
    "x": 0,
    "y": 0,
    "r": 150
  }
};