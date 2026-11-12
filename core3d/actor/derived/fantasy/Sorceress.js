import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'
import { jumpStyles } from '/core3d/constants.js'
import { FlameUp } from '/core3d/Particles.js'

const animDict = {
  idle: 'Standing Idle',
  walk: 'Standing Walk Forward',
  run: 'Standing Sprint Forward',
  attack: 'Standing 1H Magic Attack 01',
  attack2: 'Standing 2H Magic Attack 04',
}

/** What to load; a game awaits requestModel(model) in init(), before it creates a sorceress. */
export const model = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/sorceress/', size: 1.72 }
export const models = [model]

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict, jumpStyle: jumpStyles.FLY_JUMP }
}

export class SorceressPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 3, ...props })
    this.flame = new FlameUp()
  }

  enterAttack() {
    this.startFlame(1, () => this.areaDamage([55, 110]))
  }

  exitAttack() {
    this.endFlame()
  }
}

export class SorceressAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
