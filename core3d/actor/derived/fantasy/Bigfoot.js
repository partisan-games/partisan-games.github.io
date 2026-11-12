import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Goalkeeper Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Punching',
}

/* LOADING */

const meshModel = { file: 'model.fbx', prefix: 'character/bigfoot/', angle: Math.PI, animDict }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class BigfootPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class BigfootAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
