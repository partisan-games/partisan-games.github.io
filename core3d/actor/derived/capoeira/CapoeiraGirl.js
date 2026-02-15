import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Ginga',
  walk: 'Dwarf Walk',
  run: 'Fast Run',
  attack: 'Benção',
  jump: 'Aú sem mão',
}

/* LOADING */

const mesh = await loadModel({ prefix: 'character/huntress/', file: 'capoeira-girl.fbx', animDict, axis: [0, 1, 0], angle: Math.PI })

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
