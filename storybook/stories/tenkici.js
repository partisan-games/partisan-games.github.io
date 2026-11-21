import Tank, * as tankModule from '/core/gameplay/bodies/vehicles/Tank.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import vehicleArt from '/core/actor/vehicleArt.js'

/**
 * A tank alone in the middle of the stage, facing right (yaw 0) or left, its shells hitting the stand-in; `facing` is
 * the way its art points.
 */
const tank = (kind, art, barrel, yaw = 0, facing = 1) => stage => {
  const block = new Tank({ kind, yaw, x: stage.width / 2 / stage.projection.pxPerMeter, clock: stage.session.clock,
    targets: [stage.dummy] })
  stage.add(block, new TankSprite(block, { art, facing, barrel, projection: stage.projection }))
  return block
}

const game = 'Tenkići'
/** The tanks as large as Do Trsta's earlier pixel tank, at 25 px a metre. */
const pxPerMeter = 25
const { partisan, german } = tankModule.tankKinds

export const vehicles = [
  { id: 'partizanski-tenk', name: 'Partizanski tenk', game, pxPerMeter, block: tankModule,
    create: tank(partisan, vehicleArt.partisanTank, { src: 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png' }) },
  { id: 'nemacki-tenk', name: 'Nemački tenk', game, pxPerMeter, block: tankModule,
    create: tank(german, vehicleArt.germanTank, { src: 'armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png', facing: -1 },
      Math.PI, -1) },
]
