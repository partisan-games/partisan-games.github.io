const animDict = {
  idle: 'Rifle Aiming Idle',
  walk: 'Rifle Walk',
  run: 'Rifle Run Aim',
  attack: 'Firing Rifle',
  attack2: 'Fire Rifle Crouch',
  // a hit and a fall of their own, so the German rifleman does not react as every other soldier
  pain: 'Reaction',
  death: 'Rifle Death',
}

const meshModel = { file: 'german-soldier.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.33, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'rifle.mp3', body: { reach: 10 } }
