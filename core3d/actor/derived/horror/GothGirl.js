const animDict = {
  idle: 'Thriller Idle',
  walk: 'Walking',
  run: 'Zombie Running',
  attack: 'Zombie Attack',
  attack2: 'Zombie Scream',
  pain: 'Zombie Reaction Hit',
  death: 'Zombie Dying',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'goth-girl.fbx', size: 1.9, prefix: 'character/zombie/', angle: Math.PI, animDict }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model; a zombie sees only 15 m. */
export const description = { model, animDict, body: { speed: .5, run: 8 }, ai: { sight: 15 } }
