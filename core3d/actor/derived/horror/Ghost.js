import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Take 001'
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'character/ghost/scene.gltf', angle: Math.PI }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class GhostPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }

  directionBlocked() {
    return false
  }
}

export class GhostAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }

  directionBlocked() {
    return false
  }

  checkHit() {
    super.checkHit()
    if (this.dead) {
      this.mesh.rotateY(.15)
      this.mesh.translateY(.03)
    }
  }
}
