import dressSutjeska from './sutjeskaLook.js'

export { partisanOutfits } from './sutjeskaLook.js'

export const animDict = {
  idle: 'Rifle Idle',
  aimIdle: 'Rifle Aiming Idle',
  aimWalk: 'Walking',
  aimRun: 'Rifle Run Aim',
  walk: 'Rifle Walk',
  run: 'Rifle Run',
  attack: 'Firing Rifle',
  // attack2: 'Fire Rifle Crouch',
  jump: 'Jump Forward',
  // special: 'Toss Grenade',
  pain: 'Hit Reaction',
  death: 'Dying',
}

export const partisanModel = { file: 'partisan.fbx', angle: Math.PI, prefix: 'character/soldier/', size: 1.8 }
export const partisanTraits = { attackSound: 'rifle.mp3', body: { reach: 50 }, dress: dressSutjeska }
const meshModel = { ...partisanModel, animDict }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { ...partisanTraits, model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel,
  body: { ...partisanTraits.body, aimable: true } }
