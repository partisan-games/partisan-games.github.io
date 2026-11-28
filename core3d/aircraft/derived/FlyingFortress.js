import { modelStatistics } from '/core/gameplay/modelStatistics.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'

// the model has its nose along x; turned, it faces ahead, as the game flies it; its height makes its wingspan 0.585 of
// the real one, as the Lancaster's of Bomber.js
const body = { file: 'aircraft/boeing-b-17-flying-fortress/optimized.glb', size: 3.42, angle: Math.PI / 2 }

/**
 * Its propellers: the model has two see-through discs on each engine, which hide; the three blades of the B-24, the
 * same Hamilton Standard propeller, turn in their place.
 */
const blades = { file: 'aircraft/consolidated-b-24-liberator/propeller.glb', scale: 1 }
const discPropellers = { model: blades, engines: [[15, 16], [18, 17], [19, 20], [21, 22]]
  .map(engine => engine.map(number => `Cylinder${number}-FACES`)) }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, blades]

/**
 * Where its guns are, as shares of its length and height from its place, at its belly: the nose, the top turret behind
 * the cockpit and the tail.
 */
const turrets = [{ ahead: .5, above: .5 }, { ahead: .22, above: .8 }, { ahead: -.5, above: .55 }]

/** How it looks, for a warplane made of a body and its model, and what it really was: a Boeing B-17 Flying Fortress. */
export const description = { model: body, discPropellers, physical: modelStatistics['b-17'], performance: modelPerformance['b-17'], turrets }
