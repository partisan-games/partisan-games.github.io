import Rifleman, * as riflemanModule from '/core/gameplay/bodies/soldiers/Rifleman.js'
import Vehicle, * as vehicleModule from '/core/gameplay/bodies/vehicles/Vehicle.js'
import Hummel, * as hummelModule from '/core/gameplay/bodies/vehicles/Hummel.js'
import Fighter, * as fighterModule from '/core/gameplay/bodies/aircraft/Fighter.js'
import DiveBomber, * as diveBomberModule from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import Flak, * as flakModule from '/core/gameplay/bodies/artillery/Flak.js'
import Potez, * as potezModule from '/core/gameplay/bodies/aircraft/Potez.js'
import RiflemanSprite from '/core/actor/soldiers/RiflemanSprite.js'
import VehicleSprite from '/core/actor/vehicles/VehicleSprite.js'
import FighterSprite from '/core/actor/aircraft/FighterSprite.js'
import DiveBomberSprite from '/core/actor/aircraft/DiveBomberSprite.js'
import FlakSprite from '/core/actor/artillery/FlakSprite.js'
import PotezSprite, { markings } from '/core/actor/aircraft/PotezSprite.js'
import { groundUnitLooks as kinds } from '/core/actor/groundUnitLooks.js'
import { yawOf } from './helpers.js'

/** Where a block stands or flies on the stage, in metres: the middle of the view, `height` above the ground. */
const middle = (stage, height = 0) => ({ x: stage.width / 2 / stage.projection.pxPerMeter, y: height })
/** What every view on the stage draws with. */
const views = stage => ({ projection: stage.projection, camera: stage })

/** Puts `body` and its view on the stage and gives the body back. */
const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** A soldier at ease; his bullets hit the stand-in. */
const soldier = kind => (stage, way) => {
  const settings = riflemanModule.riflemanKinds[kind]
  const body = new Rifleman({ kind: settings, ...middle(stage, settings.size.height / 2), yaw: yawOf(way),
    clock: stage.session.clock, targets: [stage.dummy] })
  return put(stage, body, new RiflemanSprite(body, { art: kinds[kind].art, ...views(stage) }))
}

/** A vehicle; its picture points the way `facing` says, and is mirrored for the other side. */
const vehicle = kind => (stage, way) => {
  const settings = vehicleModule.vehicleKinds[kind]
  const { art, attack, facing } = kinds[kind]
  const VehicleBody = kind === 'tank' ? Hummel : Vehicle
  const body = new VehicleBody({ kind: settings, ...middle(stage, settings.size.height / 2), yaw: yawOf(way),
    targets: [stage.dummy] })
  return put(stage, body, new VehicleSprite(body, { art, attack, facing, ...views(stage) }))
}

/** The Bf 109 flies level at the height of the stand-in: left as when it comes head on, right as from behind. */
const fighter = (stage, way) => {
  const body = new Fighter({ ...middle(stage, stage.dummy.y), clock: stage.session.clock, targets: [stage.dummy] })
  body.face(way)
  body.steer(way * fighterModule.fighter.speed, 0)
  return put(stage, body, new FighterSprite(body, views(stage)))
}

/** The Ju 87 flies at its height, high enough to dive on the ground below it. */
const diveBomber = (stage, way) => {
  const body = new DiveBomber({ ...middle(stage, 12.86), yaw: yawOf(way) })
  body.enter()
  return put(stage, body, new DiveBomberSprite(body, views(stage)))
}

/** The plane flies on at its airspeed, so the view follows it from the start. */
const plane = (stage, way, src) => {
  const body = new Potez({ ...middle(stage, stage.dummy.y), clock: stage.session.clock })
  stage.follow(body)
  return put(stage, body, new PotezSprite(body, { src, ...views(stage) }))
}

const flak = stage => {
  const body = new Flak({ ...middle(stage), clock: stage.session.clock, targets: [stage.dummy] })
  body.y = body.size.height / 2
  return put(stage, body, new FlakSprite(body, views(stage)))
}

const game = 'Franjo Kluz'
/** Franjo Kluz draws its world at 30.8 px a metre. */
const pxPerMeter = 30.8

export const soldiers = [
  { id: 'strelac', name: 'Nemački strelac', game, pxPerMeter, way: -1, settings: ['rifle.reload', 'rifle.speed', 'rifle.damage', 'riflemanKinds.soldier.health'], block: riflemanModule, create: soldier('soldier') },
  { id: 'jurisnik', name: 'Nemački jurišnik', game, pxPerMeter, way: -1, settings: ['rifle.reload', 'rifle.speed', 'rifle.damage', 'riflemanKinds.assault.health'], block: riflemanModule, create: soldier('assault') },
]

export const vehicles = [
  { id: 'hummel', name: 'Hummel', game, pxPerMeter, way: kinds.tank.facing, settings: ['hummelKind.speed', 'hummelKind.health', 'hummel.fireTime'], block: hummelModule, create: vehicle('tank') },
  { id: 'opel-blitz', name: 'Opel Blitz', game, pxPerMeter, way: kinds.truck.facing, settings: ['vehicleKinds.truck.speed', 'vehicleKinds.truck.health'], block: vehicleModule, create: vehicle('truck') },
  { id: 'opel-blitz-legija', name: 'Opel Blitz, legija', game, pxPerMeter, way: kinds.legionTruck.facing, settings: ['vehicleKinds.legionTruck.speed', 'vehicleKinds.legionTruck.health'], block: vehicleModule, create: vehicle('legionTruck') },
  { id: 'bp42', name: 'Oklopni voz BP-42', game, pxPerMeter, way: kinds.train.facing, settings: ['vehicleKinds.train.speed', 'vehicleKinds.train.health'], block: vehicleModule, create: vehicle('train') },
]

export const aircraft = [
  { id: 'potez', name: 'Potez 25', game, pxPerMeter, settings: ['flight.thrust', 'gun.reload', 'plane.bombs', 'plane.health'],
    looks: [{ id: 'ndh', name: 'NDH', value: markings.ndh }, { id: 'partizanski', name: 'Partizanski', value: markings.partisan }],
    block: potezModule, create: plane },
  { id: 'bf109', name: 'Bf 109', game, pxPerMeter, way: -1, settings: ['fighter.speed', 'fighter.gun.reload', 'fighter.gun.damage', 'fighter.health'], block: fighterModule, create: fighter },
  { id: 'ju87-obrusavac', name: 'Ju 87', game, pxPerMeter, way: -1, settings: ['diveBomber.speed', 'diveBomber.diveSpeed', 'diveBomber.health'], block: diveBomberModule, create: diveBomber },
]

export const artillery = [
  { id: 'flak38', name: 'Flak 38', game, pxPerMeter, settings: ['flak.reload', 'flak.shellSpeed', 'flak.damage', 'flak.health'], block: flakModule, create: flak },
]
