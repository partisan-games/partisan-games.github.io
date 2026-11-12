import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Orc Walk',
  // run: 'Unarmed Run Forward',
  attack: 'Zombie Attack',
  // attack2: 'Zombie Kicking',
  // special: 'Zombie Scream',
  pain: 'Zombie Reaction Hit',
  death: 'Death From The Back',
}

/* LOADING */

const meshModel = { file: 'model.fbx', prefix: 'character/orc/', animDict, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class OrcPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class OrcAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
