import { modelStatistics } from '/core/gameplay/modelStatistics.js'

const body = { file: 'aircraft/airplane/bomber-lancaster/model.glb', size: 3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

/**
 * Where its guns are, measured at the muzzles in the model, as shares of its length and height from its place, at its
 * belly: the nose, the top turret behind the wings and the tail.
 */
const turrets = [{ ahead: .5, above: .5 }, { ahead: -.19, above: .76 }, { ahead: -.5, above: .51 }]

/** How it looks, for a warplane made of a body and its model, and what it really was: an Avro Lancaster. */
export const description = { model: body, physical: modelStatistics.lancaster, turrets }
