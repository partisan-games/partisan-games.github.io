import { loadedModel } from '/core3d/assets/models.js'
import AI from '/core3d/actor/AI.js'
import Player from '/core3d/actor/Player.js'

const animDict = {
  idle: 'Rifle Idle',
  walk: 'Rifle Walk',
  run: 'Rifle Run',
  attack: 'Firing Rifle',
  // attack2: 'Fire Rifle Crouch',
  // jump: 'Jump Forward',
  // special: 'Toss Grenade',
  pain: 'Hit Reaction',
  death: 'Dying',
}

/* LOADING */

const meshModel = { file: 'partisan-lowpoly.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, attackSound: 'rifle.mp3' }
}

export class PartisanLowpolyPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class PartisanLowpolyAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
  }
}
