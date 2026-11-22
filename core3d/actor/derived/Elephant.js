const animDict = {
  walk: 'Take 001'
}

const meshModel = { file: 'animal/elephant/Unity2Skfb.gltf', size: 8, angle: Math.PI, fitVisible: true }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, raise: -.32, deathPose: 'beast', body: { health: 1000 } }
