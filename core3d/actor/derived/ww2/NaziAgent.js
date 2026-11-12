import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Standing Idle',
  walk: 'Standard Walk',
  run: 'Pistol Run',
  attack: 'Shooting',
  pursue: 'Pistol Walk',
  pain: 'Pistol Hit Reaction',
  death: 'Dying',
}

/* LOADING */

const meshModel = { file: 'nazi-agent.fbx', prefix: 'character/soldier/', animDict, angle: Math.PI + .3, size: 1.8 }
const rightHandWeaponModel = { file: 'weapon/luger/model.fbx', scale: .18 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rightHandWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const rightHandWeapon = loadedModel(rightHandWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, rightHandWeapon, attackSound: 'rifle.mp3' }
}

export class NaziAgentPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}

export class NaziAgentAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), attackDistance: 10, ...props })
  }
}
