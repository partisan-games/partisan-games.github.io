/**
 * The Hotchkiss H35, one of the two tanks the partisans took at Kraljevo in 1941, at its real size: the model is in
 * metres, 2.09 m high, its gun ahead along +z. Its turret is the part named `turret`.
 */
const meshModel = { file: 'tank/hotchkiss-h35.glb', size: 2.09 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks and fights, for a character made of a body and its model: its 37 mm gun fires as the tank's shot. */
export const description = { model: meshModel, animDict: {}, deathPose: 'armor', attackSound: 'cannon-shot.mp3', attackProfile: 'cannon',
  body: { speed: 2, health: 1000, reach: 40, strikeHeight: 1.6, strikeAhead: 2.1, actions: { attack: .8 } } }
