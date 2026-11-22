const animDict = {
  idle: 'Machine Gun Idle',
  walk: 'Machine Gun Walk',
  run: 'Rifle Run',
  attack: 'Crouch Rapid Fire',
  attack2: 'Machine Gun Idle',
  pain: 'Hit Reaction',
  death: 'Crouch Death',
}

const meshModel = { file: 'german-machine-gunner.fbx', animDict, prefix: 'character/soldier/', angle: Math.PI }
const twoHandedWeaponModel = { file: 'weapon/flame-gun/model.fbx', scale: .75 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/** How it looks, sounds and acts, for a character made of a body and its model; it does not turn while it burns. */
export const description = { model: meshModel, animDict, twoHandedWeapon: twoHandedWeaponModel, attackSound: 'fire-swoosh.mp3',
  flame: { weaponMuzzle: [5.1, 3.96, 141.79] },
  body: { speed: 1.8, reach: 7, turnWhileAttack: false } }
