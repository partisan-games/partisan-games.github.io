import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Warrior Idle',
  walk: 'Walk',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'resistance-fighter.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict }
}

export class WorkerPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    if (this.chaseCamera) this.chaseCamera.distance = 1.5
  }
}

export class WorkerAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
