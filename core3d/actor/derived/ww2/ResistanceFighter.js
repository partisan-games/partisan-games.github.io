import Player from '/core3d/actor/Player.js'
import { icons } from '/core/io/icons.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Rifle Idle',
  walk: 'Rifle Walk',
  run: 'Rifle Run',
  attack: 'Firing Rifle',
  pain: 'Hit Reaction',
  death: 'Dying',
}

const meshModel = { file: 'resistance-fighter.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { buttonDict: { attack: icons.shoot }, mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, attackSound: 'rifle.mp3', attackDistance: 50 }
}

export class ResistanceFighterPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    if (this.chaseCamera) this.chaseCamera.distance = 1.5
  }
}

export class ResistanceFighterAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
