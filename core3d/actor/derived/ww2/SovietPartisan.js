import dressNikoletina from './nikoletinaLook.js'

const animDict = {
  idle: 'Machine Gun Idle',
  walk: 'Machine Gun Walk',
  run: 'Rifle Run',
  attack: 'Gunplay',
  pain: 'Hit Reaction',
  death: 'Dying',
}

const meshModel = { file: 'soviet-partisan.fbx', prefix: 'character/soldier/', animDict, angle: Math.PI, size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/mg-42/model.fbx', scale: .4 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, dress: dressNikoletina,
  attackSound: 'rifle.mp3', body: { reach: 10 } }
