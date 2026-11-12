import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = { walk: 'flamingo_flyA_' }

/* LOADING */

const meshModel = { file: 'animal/flamingo.glb', size: 20, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  return { mesh, animations: mesh.userData.animations, animDict, speed: 8, shouldRaycastGround: true, altitude: 60 }
}

export class FlamingoPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.mesh.position.y = 45
  }
}

export class FlamingoAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.mesh.position.y = 45
  }
}
