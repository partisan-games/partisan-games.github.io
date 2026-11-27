import Rifleman, * as riflemanModule from '/core/gameplay/bodies/soldiers/Rifleman.js'
import { playerControls } from '../playerControls.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import PlaneKeys from '/core/gameplay/controllers/PlaneKeys.js'
import * as vehicleModule from '/core/gameplay/bodies/vehicles/Vehicle.js'
import * as hummelModule from '/core/gameplay/bodies/vehicles/Hummel.js'
import * as trainModule from '/core/gameplay/bodies/vehicles/BP42.js'
import Fighter, * as fighterModule from '/core/gameplay/bodies/aircraft/Fighter.js'
import DiveBomber, * as diveBomberModule from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import LevelBomber, * as levelBomberModule from '/core/gameplay/bodies/aircraft/LevelBomber.js'
import Scout, * as scoutModule from '/core/gameplay/bodies/aircraft/Scout.js'
import Flak, * as flakModule from '/core/gameplay/bodies/artillery/Flak.js'
import Potez, * as potezModule from '/core/gameplay/bodies/aircraft/Potez.js'
import RiflemanSprite from '/core/actor/soldiers/RiflemanSprite.js'
import VehicleSprite from '/core/actor/vehicles/VehicleSprite.js'
import FighterSprite from '/core/actor/aircraft/FighterSprite.js'
import DiveBomberSprite from '/core/actor/aircraft/DiveBomberSprite.js'
import PictureAircraftSprite, { aircraftPictures } from '/core/actor/aircraft/PictureAircraftSprite.js'
import FlakSprite from '/core/actor/artillery/FlakSprite.js'
import PotezSprite, { markings } from '/core/actor/aircraft/PotezSprite.js'
import { groundUnitLooks as kinds } from '/core/actor/groundUnitLooks.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

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
  const { art, attack, facing, Body: VehicleBody } = kinds[kind]
  const body = new VehicleBody({ kind: settings, ...middle(stage, settings.size.height / 2), yaw: yawOf(way),
    targets: [stage.dummy], wreckState: true })
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
  stage.follow(body)
  return put(stage, body, new DiveBomberSprite(body, views(stage)))
}

/** The He 111 flies level high above the ground, where its bombs fall on the stand-in when it is set to fire. */
const levelBomber = (stage, way) => {
  const body = new LevelBomber({ ...middle(stage, 20), yaw: yawOf(way) })
  stage.follow(body)
  return put(stage, body, new PictureAircraftSprite(body, { picture: aircraftPictures.he111, ...views(stage) }))
}

/** The Storch flies low and slow. */
const scout = (stage, way) => {
  const body = new Scout({ ...middle(stage, 9), yaw: yawOf(way) })
  stage.follow(body)
  return put(stage, body, new PictureAircraftSprite(body, { picture: aircraftPictures.storch, ...views(stage) }))
}

/** The plane flies on at its airspeed, so the view follows it from the start; it flies on the game's controls. */
const plane = (stage, way, src) => {
  const body = new Potez({ ...middle(stage, stage.dummy.y), clock: stage.session.clock })
  playerControls(stage, input => new PlaneKeys(body, { input, bombKey: inputLayouts.potez.bombKey }), inputLayouts.potez)
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
const pxPerMeter = scales.side

export const soldiers = [
  { id: 'strelac', name: 'Nemački strelac', game, pxPerMeter, way: -1, block: riflemanModule, create: soldier('soldier') },
  { id: 'jurisnik', name: 'Nemački jurišnik', game, pxPerMeter, way: -1, block: riflemanModule, create: soldier('assault') },
]

export const vehicles = [
  { id: 'hummel', name: 'Hummel', game, pxPerMeter, way: kinds.tank.facing, block: hummelModule, create: vehicle('tank') },
  { id: 'opel-blitz', name: 'Opel Blitz', game, pxPerMeter, way: kinds.truck.facing, block: vehicleModule, create: vehicle('truck') },
  { id: 'opel-blitz-legija', name: 'Opel Blitz, legija', game, pxPerMeter, way: kinds.legionTruck.facing, block: vehicleModule, create: vehicle('legionTruck') },
  { id: 'bp42', name: 'Oklopni voz BP-42', game, pxPerMeter, way: kinds.train.facing, block: trainModule, create: vehicle('train') },
]

export const aircraft = [
  { id: 'potez', name: 'Potez 25', game, pxPerMeter,
    looks: [{ id: 'ndh', name: 'NDH', value: markings.ndh }, { id: 'partizanski', name: 'Partizanski', value: markings.partisan }],
    block: potezModule, create: plane },
  { id: 'bf109', name: 'Bf 109', game, pxPerMeter, way: -1, block: fighterModule, create: fighter },
  { id: 'ju87-obrusavac', name: 'Ju 87', game, pxPerMeter, way: -1, block: diveBomberModule, create: diveBomber },
  { id: 'he111-bombarder', name: 'He 111', game, pxPerMeter, way: -1, block: levelBomberModule, create: levelBomber },
  { id: 'storch-izvidjac', name: 'Fieseler Storch', game, pxPerMeter, way: -1, block: scoutModule, create: scout },
]

export const artillery = [
  { id: 'flak38', name: 'Flak 38', game, pxPerMeter, block: flakModule, create: flak },
]
