import { separateModels } from './catalogEntries.js'
import Tank, * as tankModule from '/core/gameplay/bodies/vehicles/Tank.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import vehicleArt from '/core/actor/vehicleArt.js'
import { germanTank, m15, stug, hotchkiss } from '/core/actor/tankLooks.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

/**
 * A tank alone in the middle of the stage, facing `way`, its shells hitting the stand-in; `facing` is the way its art
 * points; it moves and fights as its model `id` does in the game.
 */
const tank = (stage, way, { id, kind, art, barrel, facing = 1, rearAim = true }) => {
  const block = new Tank({ kind, rearAim, performance: modelPerformance[id], yaw: yawOf(way), x: stage.width / 2 / stage.projection.pxPerMeter, clock: stage.session.clock,
    targets: [stage.dummy] })
  stage.add(block, new TankSprite(block, { art, facing, barrel, projection: stage.projection }))
  return block
}

const game = 'Tenkići'
/** The tanks as large as Do Trsta's earlier pixel tank, at 25 px a metre. */
const pxPerMeter = scales.side
const partisan = { id: 'partisanTank', kind: tankModule.tankKinds.partisan, art: vehicleArt.partisanTank,
  barrel: { src: 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png' } }

export const vehicles = [
  { id: 'partizanski-tenk', name: 'Partizanski tenk', game, pxPerMeter, way: 1, block: tankModule,
    create: (stage, way) => tank(stage, way, partisan) },
  { id: 'nemacki-tenk', name: 'Nemački tenk', game, pxPerMeter, way: -1, block: tankModule,
    modelIds: { 'tiger-i': 'nemacki-tenk', 'm15-42': 'm15-42', 'stug-iii': 'stug-iii', hotchkiss: 'hotchkiss' },
    looks: [germanTank, m15, stug, hotchkiss].map(value => ({ id: value.id, name: value.name, value })),
    create: (stage, way, look = germanTank) => tank(stage, way, look) },
].flatMap(story => story.looks ? separateModels(story) : [story])
