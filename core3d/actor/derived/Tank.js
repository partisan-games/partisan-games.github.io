import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'
import { reactions } from '/core3d/constants.js'

/* LOADING */

const meshModel = { file: 'tank/renault-ft.fbx', texture: 'metal/metal01.jpg', size: 2.5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, speed: 2, attackDistance: 15, hitColor: 0x9E3C0E, energy: 1000 }
}

export class TankPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class TankAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), baseState: 'patrol', patrolDistance: 30, ...props })
  }

  turnSmooth() {
    super.turnSmooth(Math.PI, 2500)
  }

  updateMove(delta, reaction = reactions.TURN_SMOOTH) {
    super.updateMove(delta, reaction)
  }
}
