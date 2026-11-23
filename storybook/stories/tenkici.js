import { separateModels } from './catalogEntries.js'
import Tank, * as tankModule from '/core/gameplay/bodies/vehicles/Tank.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import vehicleArt from '/core/actor/vehicleArt.js'
import { germanTank, m15, stug, hotchkiss } from '/core/actor/tankLooks.js'
import { yawOf } from './helpers.js'

/**
 * A tank alone in the middle of the stage, facing `way`, its shells hitting the stand-in; `facing` is the way its art
 * points.
 */
const tank = (stage, way, { kind, art, barrel, facing = 1, rearAim = true }) => {
  const block = new Tank({ kind, rearAim, yaw: yawOf(way), x: stage.width / 2 / stage.projection.pxPerMeter, clock: stage.session.clock,
    targets: [stage.dummy] })
  stage.add(block, new TankSprite(block, { art, facing, barrel, projection: stage.projection }))
  return block
}

const game = 'Tenkići'
/** The tanks as large as Do Trsta's earlier pixel tank, at 25 px a metre. */
const pxPerMeter = 25
const partisan = { kind: tankModule.tankKinds.partisan, art: vehicleArt.partisanTank,
  barrel: { src: 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png' } }

export const vehicles = [
  { id: 'partizanski-tenk', name: 'Partizanski tenk', game, pxPerMeter, way: 1, block: tankModule,
    create: (stage, way) => tank(stage, way, partisan) },
  { id: 'nemacki-tenk', name: 'Nemački tenk', game, pxPerMeter, way: -1, block: tankModule,
    modelNames: { 'tiger-i': 'Nemački tenk' },
    modelIds: { 'tiger-i': 'nemacki-tenk', 'm15-42': 'm15-42', 'stug-iii': 'stug-iii', hotchkiss: 'hotchkiss' },
    looks: [germanTank, m15, stug, hotchkiss].map(value => ({ id: value.id, name: value.name, value })),
    create: (stage, way, look = germanTank) => tank(stage, way, look) },
].flatMap(story => story.looks ? separateModels(story) : [story])
