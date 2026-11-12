import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Kicking',
  attack2: 'Mutant Swiping',
  pain: 'Zombie Reaction Hit',
  death: 'Standing Death Forward 01',
}

/** What to load; a game awaits requestModel(model) in init(), before it creates a golem. */
export const model = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/golem/', size: 2.5 }
export const models = [model]

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class GolemPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class GolemAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
