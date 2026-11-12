import { loadedModel } from '/core3d/assets/models.js'
import AI from '/core3d/actor/AI.js'
import Player from '/core3d/actor/Player.js'

export const animDict = {
  idle: 'Rifle Aiming Idle',
  walk: 'Walking',
  run: 'Rifle Run Aim',
  jump: 'Jump Forward',
  attack: 'Firing Rifle',
  death: 'Dying',
}

/* LOADING */

const meshModel = { file: 'partisan.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle-berthier/model.fbx', scale: .60, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, attackDistance: 50, attackSound: 'rifle.mp3' }
}

export class PartisanAimAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class PartisanAimPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
