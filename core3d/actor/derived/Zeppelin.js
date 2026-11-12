import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

/* LOADING */

const meshModel = { file: 'aircraft/airship/zeppelin.fbx', size: 20 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, shouldRaycastGround: true, speed: 4, baseState: 'patrol', patrolDistance: Infinity, altitude: 40 }
}

export class ZeppelinPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.mesh.position.y = 60
    this.propeller = this.mesh.getObjectByName('propeler')
  }

  update(delta) {
    super.update(delta)
    this.propeller?.rotateY(delta * -1)
  }
}

export class ZeppelinAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.mesh.position.y = 60
    this.propeller = this.mesh.getObjectByName('propeler')
  }

  update(delta) {
    super.update(delta)
    this.propeller?.rotateY(delta * -1)
  }
}
