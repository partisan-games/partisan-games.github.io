import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Zombie Idle',
  walk: 'Walking',
  run: 'Zombie Running',
  attack: 'Zombie Kicking',
  attack2: 'Zombie Attack',
  pain: 'Zombie Reaction Hit',
  death: 'Zombie Dying',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-guard.fbx', size: 1.8, prefix: 'character/zombie/', angle: Math.PI, animDict }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict, speed: .5, runCoefficient: 8, sightDistance: 15 }
}

export class ZombieGuardPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class ZombieGuardAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
