const animDict = {
  idle: 'Standing Idle',
  walk: 'Standard Walk',
  run: 'Pistol Run',
  attack: 'Shooting',
  pursue: 'Pistol Walk',
  pain: 'Pistol Hit Reaction',
  death: 'Dying',
}

const meshModel = { file: 'nazi-agent.fbx', prefix: 'character/soldier/', animDict, angle: Math.PI + .3, size: 1.8 }
const rightHandWeaponModel = { file: 'weapon/luger/model.fbx', scale: .18 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rightHandWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, rightHandWeapon: rightHandWeaponModel, attackSound: 'rifle.mp3', body: { reach: 10 } }
