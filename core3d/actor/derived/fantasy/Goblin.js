import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Great Sword Idle',
  walk: 'Great Sword Walk',
  attack: 'Great Sword Slash',
  death: 'Two Handed Sword Death',
}

/* LOADING */

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/goblin/', size: 1.5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class GoblinPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class GoblinAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
