import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Ginga',
  walk: 'Catwalk Walk Forward',
  run: 'Drunk Walking',
  attack: 'Ponteira',
}

// case 'special': return SpecialState
// case 'jump': return chooseJumpState(jumpStyle)
// case 'attack':
// case 'attack2': {

/* LOADING */

const mesh = await loadModel({ prefix: 'character/capoeira/', file: 'model.fbx', animDict, axis: [0, 1, 0], angle: Math.PI })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict }

export class CapoeiraGirlPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}

export class CapoeiraGirlAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
