import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

export const animDict = {
  idle: 'Dwarf Idle',
  walk: 'Pistol Walk',
  run: 'Pistol Run',
  attack: 'Shooting',
  special: 'Yelling',
  pain: 'Hit Reaction Pistol',
  death: 'Standing React Death Backward',
}

const meshModel = { file: 'nazi-officer.fbx', prefix: 'character/soldier/', animDict, angle: Math.PI + .3, size: 2 }
const rightHandWeaponModel = { file: 'weapon/luger/model.fbx', scale: .18 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rightHandWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, rightHandWeapon: rightHandWeaponModel, attackSound: 'rifle.mp3', body: { speed: 1.9, reach: 10 } }

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const rightHandWeapon = loadedModel(rightHandWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, rightHandWeapon, speed: 1.9, attackSound: 'rifle.mp3' }
}

export class NaziOfficerAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
  }
}
