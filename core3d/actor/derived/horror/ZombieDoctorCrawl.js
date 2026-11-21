const animDict = {
  idle: 'Sleeping Idle',
  walk: 'Zombie Crawl',
  run: 'Running Crawl',
  attack: 'Zombie Biting',
  death: 'Prone Death',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'zombie-doctor.fbx', size: 1.78, prefix: 'character/zombie/', angle: Math.PI, animDict }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model; a zombie sees only 15 m. */
export const description = { model, animDict, body: { speed: .5, run: 8 }, ai: { sight: 15 } }
