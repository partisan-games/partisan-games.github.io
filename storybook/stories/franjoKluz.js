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
import { kinds } from '/scenes/franjo-kluz/enemies.js'

/** Where a block stands or flies on the stage, in metres: the middle of the view, `height` above the ground. */
const middle = (stage, height = 0) => ({ x: stage.width / 2 / stage.projection.pxPerMeter, y: height })
/** What every view on the stage draws with. */
const views = stage => ({ projection: stage.projection, camera: stage })

/** Puts `body` and its view on the stage and gives the body back. */
const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** A soldier facing left, as towards the plane, at ease; his bullets hit the stand-in. */
const soldier = kind => stage => {
  const settings = riflemanModule.riflemanKinds[kind]
  const body = new Rifleman({ kind: settings, ...middle(stage, settings.size.height / 2), yaw: Math.PI,
    clock: stage.session.clock, targets: [stage.dummy] })
  return put(stage, body, new RiflemanSprite(body, { art: kinds[kind].art, ...views(stage) }))
}

/** A vehicle facing the way its picture does. */
const vehicle = kind => stage => {
  const settings = vehicleModule.vehicleKinds[kind]
  const { art, attack, facing } = kinds[kind]
  const VehicleBody = kind === 'tank' ? Hummel : Vehicle
  const body = new VehicleBody({ kind: settings, ...middle(stage, settings.size.height / 2), yaw: facing < 0 ? Math.PI : 0,
    targets: [stage.dummy] })
  return put(stage, body, new VehicleSprite(body, { art, attack, facing, ...views(stage) }))
}

/** The Bf 109 flies level at the height of the stand-in: left as when it comes head on, right as from behind. */
const fighter = way => stage => {
  const body = new Fighter({ ...middle(stage, stage.dummy.y), clock: stage.session.clock, targets: [stage.dummy] })
  body.face(way)
  body.steer(way * fighterModule.fighter.speed, 0)
  return put(stage, body, new FighterSprite(body, views(stage)))
}

/** The Ju 87 flies left at its height, high enough to dive on the ground below it. */
const diveBomber = stage => {
  const body = new DiveBomber({ ...middle(stage, 12.86), yaw: Math.PI })
  body.enter()
  return put(stage, body, new DiveBomberSprite(body, views(stage)))
}

/** The plane flies on at its airspeed, so the view follows it from the start. */
const plane = src => stage => {
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
  { id: 'strelac', name: 'Nemački strelac', game, pxPerMeter, block: riflemanModule, create: soldier('soldier') },
  { id: 'jurisnik', name: 'Nemački jurišnik', game, pxPerMeter, block: riflemanModule, create: soldier('assault') },
]

export const vehicles = [
  { id: 'hummel', name: 'Hummel', game, pxPerMeter, block: hummelModule, create: vehicle('tank') },
  { id: 'opel-blitz', name: 'Opel Blitz', game, pxPerMeter, block: vehicleModule, create: vehicle('truck') },
  { id: 'opel-blitz-legija', name: 'Opel Blitz, legija', game, pxPerMeter, block: vehicleModule, create: vehicle('legionTruck') },
  { id: 'bp42', name: 'Oklopni voz BP-42', game, pxPerMeter, block: vehicleModule, create: vehicle('train') },
]

export const aircraft = [
  { id: 'potez-ndh', name: 'Potez 25, NDH', game, pxPerMeter, block: potezModule, create: plane(markings.ndh) },
  { id: 'potez-partizanski', name: 'Potez 25, partizanski', game, pxPerMeter, block: potezModule, create: plane(markings.partisan) },
  { id: 'bf109-levo', name: 'Bf 109, nalevo', game, pxPerMeter, block: fighterModule, create: fighter(-1) },
  { id: 'bf109-desno', name: 'Bf 109, nadesno', game, pxPerMeter, block: fighterModule, create: fighter(1) },
  { id: 'ju87-obrusavac', name: 'Ju 87', game, pxPerMeter, block: diveBomberModule, create: diveBomber },
]

export const artillery = [
  { id: 'flak38', name: 'Flak 38', game, pxPerMeter, block: flakModule, create: flak },
]
