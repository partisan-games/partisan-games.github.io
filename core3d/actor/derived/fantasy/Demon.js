const animDict = {
  idle: 'Mutant Breathing Idle',
  walk: 'Mutant Walking',
  jump: 'Mutant Jumping',
  attack: 'Zombie Attack',
  special: 'Zombie Scream',
}

const meshModel = { file: 'model.fbx', prefix: 'character/demon/', animDict, angle: Math.PI, size: 3 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/**
 * How it looks, sounds and acts, for a character made of a body and its model: its scream burns every one around it
 * within 3 m, in a flame that pours from it as the scream lands.
 */
export const description = { model: meshModel, animDict, flame: { kinds: ['special'], fromBlow: true },
  body: { area: { kinds: ['special'] } } }
