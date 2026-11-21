
const animDict = {
  idle: 'Standing Idle',
  walk: 'Standing Walk Forward',
  run: 'Standing Sprint Forward',
  attack: 'Standing 1H Magic Attack 01',
  attack2: 'Standing 2H Magic Attack 04',
}

/** What to load; a game awaits requestModel(model) in init(), before it creates a sorceress. */
export const model = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/sorceress/', size: 1.72 }
export const models = [model]

/**
 * How it looks, sounds and acts, for a character made of a body and its model: her spell burns every one around her
 * within 3 m, where flames rise as it lands.
 */
export const description = { model, animDict, flame: { particles: 'FlameUp', fromBlow: true },
  body: { area: { kinds: ['attack', 'attack2'], damage: [55, 110] }, jumping: 'fly' } }
