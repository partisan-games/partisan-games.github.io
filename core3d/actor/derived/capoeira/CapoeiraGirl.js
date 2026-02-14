import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'
import IdleState from '../../states/IdleState.js'
import SpecialState from '../../states/SpecialState.js'

const animDict = {
  idle: 'Ginga',
  Ginga: 'Ginga',
}

/* LOADING */

const mesh = await loadModel({ prefix: 'character/capoeira/', file: 'model.fbx', animDict, axis: [0, 1, 0], angle: Math.PI })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict }

export class CapoeiraGirlPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }

  setState(name, state) {
    const chooseState = () => state === 'special' ? SpecialState : IdleState
    this.fsm.setState(name, chooseState)
  }
}

export class CapoeiraGirlAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
