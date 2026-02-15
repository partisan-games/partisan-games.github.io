import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Ginga',
  walk: 'Dwarf Walk',
  run: 'Fast Run',
  attack: 'Benção',
  attack2: 'Mma Kick',
  special: 'Chapa giratória',
  jump: 'Aú de coluna', // Backflip
}

/* LOADING */

const mesh = await loadModel({ prefix: 'character/barbarian/', file: 'capoeira-girl.fbx', animDict, axis: [0, 1, 0], angle: Math.PI })

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
