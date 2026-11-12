import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Attack',
  pain: 'Shove Reaction',
  death: 'Mutant Dying',
}

/* LOADING */

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/troll/', size: 3 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class TrollPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class TrollAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
