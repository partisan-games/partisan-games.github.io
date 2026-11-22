const animDict = { idle: 'flamingo_flyA_', walk: 'flamingo_flyA_' }

const meshModel = { file: 'animal/flamingo.glb', size: 20, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks and acts, for a character made of a body and its model: it flies 60 m above the ground. */
export const description = { model: meshModel, animDict, deathPose: 'bird', body: { speed: 8, altitude: 60 } }
