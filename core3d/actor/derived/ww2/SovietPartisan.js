import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Machine Gun Idle',
  walk: 'Machine Gun Walk',
  run: 'Rifle Run',
  attack: 'Gunplay',
  pain: 'Hit Reaction',
  death: 'Dying',
}

/* LOADERS */

/* LOADING */

const meshModel = { file: 'soviet-partisan.fbx', prefix: 'character/soldier/', animDict, angle: Math.PI, size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/mg-42/model.fbx', scale: .4 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, attackStyle: 'LOOP', attackSound: 'rifle.mp3' }
}

export class SovietPartisanPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class SovietPartisanAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
  }
}
