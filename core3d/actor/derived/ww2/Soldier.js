import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

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

const meshModel = { file: 'soldier.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/' }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, attackSound: 'rifle.mp3' }
}

export class SoldierPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class SoldierAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
  }
}
