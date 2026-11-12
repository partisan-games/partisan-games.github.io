import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Sleeping Idle',
  walk: 'Zombie Crawl',
  run: 'Running Crawl',
  attack: 'Zombie Biting',
  death: 'Prone Death',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-doctor.fbx', size: 1.78, prefix: 'character/zombie/', angle: Math.PI, animDict }
export const models = [model]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(model)
  return { mesh, animations: mesh.userData.animations, animDict, speed: .5, runCoefficient: 8, sightDistance: 15 }
}

export class ZombieDoctorCrawlPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class ZombieDoctorCrawlAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
