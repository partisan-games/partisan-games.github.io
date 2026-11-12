import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Zombie Idle',
  walk: 'Zombie Walk',
  run: 'Zombie Run',
  attack: 'Zombie Neck Bite',
  attack2: 'Zombie Attack Two Hand',
  pain: 'Hit Reaction',
  death: 'Zombie Death',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-cop.fbx', size: 1.8, prefix: 'character/zombie/', animDict, angle: Math.PI }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict, speed: .5, runCoefficient: 8, sightDistance: 15 }
}

export class ZombieCopPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class ZombieCopAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
