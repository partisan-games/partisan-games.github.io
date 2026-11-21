const animDict = {
  idle: 'Zombie Idle',
  walk: 'Zombie Walk',
  run: 'Zombie Run',
  attack: 'Zombie Neck Bite',
  attack2: 'Zombie Attack Two Hand',
  pain: 'Hit Reaction',
  death: 'Zombie Death',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-cop.fbx', size: 1.8, prefix: 'character/zombie/', animDict, angle: Math.PI }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model; a zombie sees only 15 m. */
export const description = { model, animDict, body: { speed: .5, run: 8 }, ai: { sight: 15 } }
