import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Zombie Idle',
  walk: 'Walking',
  run: 'Zombie Running',
  attack: 'Zombie Kicking',
  attack2: 'Zombie Attack',
  pain: 'Zombie Reaction Hit',
  death: 'Zombie Dying',
}

/* LOADING */

const mesh = await loadModel({ file: 'zombie-guard.fbx', size: 1.8, prefix: 'character/zombie/', angle: Math.PI, animDict })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict, speed: .5, runCoefficient: 8, sightDistance: 15 }

export class ZombieGuardPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}

export class ZombieGuardAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
