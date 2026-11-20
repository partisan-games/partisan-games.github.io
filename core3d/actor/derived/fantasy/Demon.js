import Player from '/core3d/actor/Player.js'
import { icons } from '/core/io/icons.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Mutant Breathing Idle',
  walk: 'Mutant Walking',
  jump: 'Mutant Jumping',
  attack: 'Zombie Attack',
  special: 'Zombie Scream',
}

const meshModel = { file: 'model.fbx', prefix: 'character/demon/', animDict, angle: Math.PI, size: 3 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { buttonDict: { jump: '', attack: icons.unarmed, special: icons.magic }, mesh, animations: mesh.userData.animations, animDict, useFlame: true }
}

export class DemonPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }

  enterSpecial() {
    this.startFlame(1, () => this.areaDamage())
  }

  exitSpecial() {
    this.endFlame()
  }
}

export class DemonAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
