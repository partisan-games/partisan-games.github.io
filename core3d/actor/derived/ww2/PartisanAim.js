export const animDict = {
  idle: 'Rifle Aiming Idle',
  walk: 'Walking',
  run: 'Rifle Run Aim',
  jump: 'Jump Forward',
  attack: 'Firing Rifle',
  death: 'Dying',
}

const meshModel = { file: 'partisan.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle-berthier/model.fbx', scale: .60, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'rifle.mp3', body: { reach: 50 } }
