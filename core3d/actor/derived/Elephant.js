import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  walk: 'Take 001'
}

/* LOADING */

const meshModel = { file: 'animal/elephant/Unity2Skfb.gltf', size: 8, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict, speed: 2, energy: 1000 }
}

export class ElephantPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class ElephantAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
