import { modelStatistics } from '/core/gameplay/modelStatistics.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'

// its height makes its wingspan 0.585 of the real one, as the Lancaster's of Bomber.js
const body = { file: 'aircraft/consolidated-b-24-liberator/model.glb', size: 3.3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

/**
 * Where its guns are, as shares of its length and height from its place, at its belly: the nose, the top turret behind
 * the cockpit and the tail.
 */
const turrets = [{ ahead: .5, above: .5 }, { ahead: .2, above: .8 }, { ahead: -.5, above: .55 }]

/** How it looks, for a warplane made of a body and its model, and what it really was: a Consolidated B-24 Liberator. */
export const description = { model: body, propellerNames: ['Propeller1', 'Propeller2', 'Propeller3', 'Propeller4'],
  physical: modelStatistics['b-24'], performance: modelPerformance['b-24'], turrets }
