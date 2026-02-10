import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadModel } from '/core3d/loaders.js'

const animDict = {
  idle: 'Sleeping Idle',
  walk: 'Zombie Crawl',
  run: 'Running Crawl',
  attack: 'Zombie Biting',
  death: 'Prone Death',
}

/* LOADING */

const mesh = await loadModel({ file: 'zombie-doctor.fbx', size: 1.78, prefix: 'character/zombie/', angle: Math.PI, animDict })

/* EXTENDED CLASSES */

const sharedProps = { mesh, animations: mesh.userData.animations, animDict, speed: .5, runCoefficient: 8, sightDistance: 15 }

export class ZombieDoctorCrawlPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}

export class ZombieDoctorCrawlAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps, ...props })
  }
}
