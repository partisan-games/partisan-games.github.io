import AntiTankGun, * as antiTankGunModule from '/core/gameplay/bodies/artillery/AntiTankGun.js'
import Bunker, * as bunkerModule from '/core/gameplay/bodies/artillery/Bunker.js'
import Tank, * as tankModule from '/core/gameplay/bodies/vehicles/Tank.js'
import AntiTankGunSprite from '/core/actor/artillery/AntiTankGunSprite.js'
import BunkerSprite from '/core/actor/artillery/BunkerSprite.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import vehicleArt from '/core/actor/vehicleArt.js'

import { yawOf } from './helpers.js'

/** Do Trsta draws its road at 20 px a metre. */
const pxPerMeter = 20

/** A block facing `way` in the middle of the stage, on the ground, its shots hitting the stand-in. */
const placed = (stage, size, way) => ({ x: stage.width / 2 / stage.projection.pxPerMeter, y: size.height / 2, yaw: yawOf(way),
  clock: stage.session.clock, targets: [stage.dummy] })
const views = stage => ({ projection: stage.projection, camera: stage })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The Somua S35, a French tank the Germans took, whose barrel art is a part of a larger picture. */
const somua = (stage, way) => {
  const { somua: kind } = tankModule.tankKinds
  const body = new Tank({ ...placed(stage, kind.size, way), kind })
  return put(stage, body, new TankSprite(body, { art: vehicleArt.somuaS35, facing: -1, ...views(stage),
    barrel: { src: 'armies/game-ready/tenkovi/somua-s35-barrel.png', facing: -1, crop: [126, 203, 1923, 309] } }))
}

const gun = (stage, way) => {
  const body = new AntiTankGun(placed(stage, { height: 1.28 }, way))
  return put(stage, body, new AntiTankGunSprite(body, views(stage)))
}

const bunker = kind => (stage, way) => {
  const settings = bunkerModule.bunkerKinds[kind]
  const body = new Bunker({ ...placed(stage, settings.size, way), kind: settings })
  return put(stage, body, new BunkerSprite(body, { kind, ...views(stage) }))
}

const game = 'Do Trsta'

export const vehicles = [
  { id: 'somua-s35', name: 'Somua S35', game, pxPerMeter, way: -1, block: tankModule, create: somua },
]

export const artillery = [
  { id: 'pak38', name: 'PaK 38', game, pxPerMeter, way: -1, block: antiTankGunModule, create: gun },
  { id: 'bunker-do-trsta', name: 'Bunker', game, pxPerMeter, way: -1, block: bunkerModule, create: bunker('pillbox') },
]
