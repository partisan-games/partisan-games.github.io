const meshModel = { file: 'aircraft/airship/zeppelin.fbx', size: 20 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks and acts, for a character made of a body and its model: it flies 40 m above the ground, its propeller turning. */
export const description = { model: meshModel, animDict: {}, deathPose: 'airship',
  spinning: { part: 'propeler', speed: -1 }, body: { speed: 4, altitude: 40 } }
