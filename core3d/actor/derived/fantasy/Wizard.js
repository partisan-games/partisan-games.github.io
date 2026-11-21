const animDict = {
  idle: 'Standing Idle',
  walk: 'Iv Pole Walking',
}

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/wizard/', size: 1.8, texture: 'terrain/snow.jpg' }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: { speed: .75 } }
