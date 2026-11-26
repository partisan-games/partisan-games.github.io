import { modelStatistics } from '/core/gameplay/modelStatistics.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'

// the model has its nose along x; turned, it faces ahead, as the game flies it; its height, with its propeller discs,
// makes its wingspan 0.585 of the real one, as the Lancaster's of Bomber.js
const body = { file: 'aircraft/north-american-b-25-mitchell/model.glb', size: 3.02, angle: -Math.PI / 2 }

/**
 * Its propellers: the model has a see-through disc on each engine, of two sizes, which hides; the three blades of the
 * B-24, the same Hamilton Standard propeller, turn in its place, 3.84 m across as on the real one, at the scale of the
 * plane.
 */
const blades = { file: 'aircraft/consolidated-b-24-liberator/propeller.glb', scale: 1 }
const discPropellers = { model: blades, engines: [['Cylinder04-FACES'], ['Cylinder05-FACES']], across: 3.84 * .585 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, blades]

/**
 * Where its guns are, as shares of its length and height from its place, at its belly: the nose, the top turret behind
 * the cockpit and the tail.
 */
const turrets = [{ ahead: .5, above: .45 }, { ahead: .1, above: .8 }, { ahead: -.5, above: .5 }]

/** How it looks, for a warplane made of a body and its model, and what it really was: a North American B-25 Mitchell. */
export const description = { model: body, discPropellers, physical: modelStatistics['b-25'], performance: modelPerformance['b-25'], turrets }
