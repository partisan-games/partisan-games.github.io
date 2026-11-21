const animDict = {
  idle: 'Zombie Idle',
  walk: 'Walking',
  run: 'Zombie Running',
  attack: 'Zombie Kicking',
  attack2: 'Zombie Attack',
  pain: 'Zombie Reaction Hit',
  death: 'Zombie Dying',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-guard.fbx', size: 1.8, prefix: 'character/zombie/', angle: Math.PI, animDict }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model; a zombie sees only 15 m. */
export const description = { model, animDict, body: { speed: .5, run: 8 }, ai: { sight: 15 } }
