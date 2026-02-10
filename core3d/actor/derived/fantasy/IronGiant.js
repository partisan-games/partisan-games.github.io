import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Idle',
  walk: 'Walking',
  jump: 'Mutant Jumping',
  attack: 'Zombie Attack',
}

/* LOADING */

const mesh = await loadModel({ file: 'model.fbx', prefix: 'character/iron-giant/', animDict, angle: Math.PI, size: 5 })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict }

export class IronGiantPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}

export class IronGiantAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
