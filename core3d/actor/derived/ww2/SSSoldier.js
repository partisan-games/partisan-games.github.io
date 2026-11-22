const animDict = {
  idle: 'Rifle Aiming Idle',
  walk: 'Rifle Walk',
  run: 'Crouched Run',
  attack: 'Firing Rifle',
  attack2: 'Fire Rifle Crouch',
  pain: 'Hit Reaction',
  death: 'Death Crouching Headshot Front',
}

const meshModel = { file: 'nazi.fbx', animDict, prefix: 'character/soldier/', angle: Math.PI, size: 1.8 }
const twoHandedWeaponModel = { file: 'weapon/rifle.fbx', scale: 1.33, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'rifle.mp3', raise: .1,
  body: { speed: 1.75, reach: 10 } }
