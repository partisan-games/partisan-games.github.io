import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Standing Idle',
  walk: 'Iv Pole Walking',
}

/* LOADING */

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/wizard/', size: 1.8, texture: 'terrain/snow.jpg' }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict, speed: .75 }
}

export class WizardPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class WizardAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
