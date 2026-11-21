const animDict = {
  idle: 'Great Sword Idle',
  walk: 'Great Sword Walk',
  attack: 'Great Sword Slash',
  death: 'Two Handed Sword Death',
}

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/goblin/', size: 1.5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
