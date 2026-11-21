
const animDict = {
  idle: 'Idle',
  walk: 'Dwarf Walk',
  run: 'Fast Run',
  jump: 'Mutant Jumping',
  attack: 'Sword And Shield Slash',
  attack2: 'Mma Kick',
  special: 'Standing 2H Magic Attack 05',
  pain: 'Standing React Large From Right',
  death: 'Falling Back Death',
}

const meshModel = { prefix: 'character/huntress/', file: 'model.fbx', angle: Math.PI, animDict, size: 1.78, runCoefficient: 4 }
const rightHandWeaponModel = { file: 'weapon/axe-lowpoly/model.fbx', scale: .18 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rightHandWeaponModel]

/**
 * How it looks, sounds and acts, for a character made of a body and its model: it strikes low, cannot be hurt while it
 * attacks, and its spell burns every one around it within 3 m in a red flame where it stands.
 */
export const description = { model: meshModel, animDict, rightHandWeapon: rightHandWeaponModel,
  flame: { particles: 'RedFlame', kinds: ['special'], fromBlow: true, around: true },
  body: { run: 2.5, jumping: 'fly', maxLift: .3, strikeHeight: .5, guarded: true, area: { kinds: ['special'] } } }
