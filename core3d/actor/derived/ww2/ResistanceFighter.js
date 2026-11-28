const animDict = {
  idle: 'Rifle Idle',
  walk: 'Rifle Walk',
  run: 'Rifle Run',
  attack: 'Firing Rifle',
  // crouched, as the escorts of a tank between shots (owner, 2026-11-28)
  crouch: 'Crouching Idle',
  pain: 'Hit Reaction',
  death: 'Dying',
}

const meshModel = { file: 'resistance-fighter.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'rifle.mp3', body: { reach: 50 } }
