import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Warrior Idle',
  walk: 'Walk',
}

/* LOADING */

const mesh = await loadModel({ file: 'resistance-fighter.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict }

export class WorkerPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
    if (this.chaseCamera) this.chaseCamera.distance = 1.5
  }
}

export class WorkerAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
