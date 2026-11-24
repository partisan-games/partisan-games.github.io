import AntiTankGun, * as antiTankGunModule from '/core/gameplay/bodies/artillery/AntiTankGun.js'
import Bunker, * as bunkerModule from '/core/gameplay/bodies/artillery/Bunker.js'
import Tank, * as tankModule from '/core/gameplay/bodies/vehicles/Tank.js'
import GunCarrier, * as gunCarrierModule from '/core/gameplay/bodies/vehicles/GunCarrier.js'
import RoadVehicle, * as roadVehicleModule from '/core/gameplay/bodies/vehicles/RoadVehicle.js'
import RoadVehicleSprite from '/core/actor/vehicles/RoadVehicleSprite.js'
import AntiTankGunSprite from '/core/actor/artillery/AntiTankGunSprite.js'
import BunkerSprite from '/core/actor/artillery/BunkerSprite.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import GunCarrierSprite, { gunCarrierPictures } from '/core/actor/vehicles/GunCarrierSprite.js'
import { somuaTank } from '/core/actor/tankLooks.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'

import { yawOf } from './helpers.js'
import scales from '../scales.js'

/** Do Trsta draws its road at 20 px a metre. */
const pxPerMeter = scales.side

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
  const body = new Tank({ ...placed(stage, kind.size, way), kind, performance: modelPerformance[somuaTank.id] })
  return put(stage, body, new TankSprite(body, { ...somuaTank, ...views(stage) }))
}

/** A machine-gun carrier of `kind`, driving at the stand-in when it is set to fire. */
const gunCarrier = id => (stage, way) => {
  const kind = gunCarrierModule.gunCarrierKinds[id]
  const body = new GunCarrier({ ...placed(stage, kind.size, way), kind })
  return put(stage, body, new GunCarrierSprite(body, { picture: gunCarrierPictures[id], ...views(stage) }))
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
  ...Object.entries(roadVehicleModule.roadVehicleKinds).map(([id, kind]) => ({
    id, name: kind.name, game, pxPerMeter, way: -1, block: roadVehicleModule,
    create: (stage, way) => {
      const body = new RoadVehicle({ ...placed(stage, kind.size, way), kind })
      return put(stage, body, new RoadVehicleSprite(body, { id, ...views(stage) }))
    },
  })),
  { id: 'somua-s35', name: 'Somua S35', game, pxPerMeter, way: -1, block: tankModule, create: somua },
  { id: 'motociklista', name: 'Motociklista sa mitraljezom', game, pxPerMeter, way: -1, block: gunCarrierModule, create: gunCarrier('motorcycle') },
  { id: 'sdkfz-251', name: 'Sd.Kfz. 251', game, pxPerMeter, way: -1, block: gunCarrierModule, create: gunCarrier('halftrack') },
  { id: 'sdkfz-222', name: 'Sd.Kfz. 222', game, pxPerMeter, way: -1, block: gunCarrierModule, create: gunCarrier('armoredCar') },
]

export const artillery = [
  { id: 'pak38', name: 'PaK 38', game, pxPerMeter, way: -1, block: antiTankGunModule, create: gun },
  { id: 'bunker-do-trsta', name: 'Bunker', game, pxPerMeter, way: -1, block: bunkerModule, create: bunker('pillbox') },
]
