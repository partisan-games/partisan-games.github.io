import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Rifle Aiming Idle',
  walk: 'Rifle Walk',
  run: 'Crouched Run',
  attack: 'Firing Rifle',
  attack2: 'Fire Rifle Crouch',
  pain: 'Hit Reaction',
  death: 'Death Crouching Headshot Front',
}

/* LOADING */

const meshModel = { file: 'nazi.fbx', animDict, prefix: 'character/soldier/', angle: Math.PI, size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.33, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, speed: 1.75, attackSound: 'rifle.mp3' }
}

export class SSSoldierPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.mesh.translateY(.1)
  }
}

export class SSSoldierAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
    this.mesh.translateY(.1)
  }
}
