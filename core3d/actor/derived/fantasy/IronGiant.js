const animDict = {
  idle: 'Idle',
  walk: 'Walking',
  jump: 'Mutant Jumping',
  attack: 'Zombie Attack',
}

const meshModel = { file: 'model.fbx', prefix: 'character/iron-giant/', animDict, angle: Math.PI, size: 5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
