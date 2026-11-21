import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Machine Gun Idle',
  walk: 'Machine Gun Walk',
  run: 'Rifle Run',
  attack: 'Crouch Rapid Fire',
  pain: 'Hit Reaction',
  death: 'Crouch Death',
}

const meshModel = { file: 'german-machine-gunner.fbx', animDict, prefix: 'character/soldier/', angle: Math.PI }
const twoHandedWeaponModel = { file: 'weapon/mg-42/lowpoly.fbx', scale: 1.4 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'rifle-burst.mp3', body: { speed: 1.8, reach: 14 } }

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, speed: 1.8, attackStyle: 'LOOP', attackSound: 'rifle-burst.mp3' }
}

export class GermanMachineGunnerAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 14, ...props })
  }
}
