import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Drunk Run Forward',
  run: 'Drunk Run Forward',
  attack: 'Terrified',
  special: 'Zombie Agonizing',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

// BUG: model is not centered
export const model = { file: 'model.fbx', size: 1.75, prefix: 'character/nude-victim/', animDict, angle: Math.PI }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict, runCoefficient: 1 }
}

export class NudeVictimPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class NudeVictimAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
