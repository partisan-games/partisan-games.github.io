import { modelStatistics } from '/core/gameplay/modelStatistics.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'

const body = { file: 'aircraft/bomber-lancaster/model.glb', size: 3 }

/**
 * Its propellers: the model has a see-through disc on each engine, which hides; the three blades of the B-24, as the
 * de Havilland propeller it flew with was a licensed Hamilton Standard, turn in its place.
 */
const blades = { file: 'aircraft/consolidated-b-24-liberator/propeller.glb', scale: 1 }
const discPropellers = { model: blades, engines: [6, 10, 14, 18].map(number => [`Object_${number}`]) }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, blades]

/**
 * Where its guns are, measured at the muzzles in the model, as shares of its length and height from its place, at its
 * belly: the nose, the top turret behind the wings and the tail.
 */
const turrets = [{ ahead: .5, above: .5 }, { ahead: -.19, above: .76 }, { ahead: -.5, above: .51 }]

/** How it looks, for a warplane made of a body and its model, and what it really was: an Avro Lancaster. */
export const description = { model: body, discPropellers, physical: modelStatistics.lancaster, performance: modelPerformance.lancaster, turrets }
