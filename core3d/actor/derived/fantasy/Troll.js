import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Attack',
  pain: 'Shove Reaction',
  death: 'Mutant Dying',
}

/* LOADING */

const mesh = await loadModel({ file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/troll/', size: 3 })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict }

export class TrollPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}

export class TrollAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
