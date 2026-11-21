import Boat, * as boatModule from '/core/gameplay/bodies/boats/Boat.js'
import SBoat, * as sBoatModule from '/core/gameplay/bodies/boats/SBoat.js'
import ShoreMachineGun, * as shoreMachineGunModule from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'
import BoatSprite from '/core/actor/boats/BoatSprite.js'
import SBoatSprite from '/core/actor/boats/SBoatSprite.js'
import ShoreMachineGunSprite from '/core/actor/artillery/ShoreMachineGunSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'

/** Čamac is seen from above at 10 px a metre: the stage draws its blocks so, x across and z down the view. */
const pxPerMeter = 25
const views = stage => {
  fromAbove(stage)
  return { projection: topProjection({ pxPerMeter }), camera: stage }
}
/** The stage `across` and `down` its width and height, in metres. */
const at = (stage, across, down) => ({ x: stage.width * across / pxPerMeter, z: stage.height * down / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The partisan boat in the middle, heading down the river. */
const boat = stage => {
  const body = new Boat({ ...at(stage, .5, .5), clock: stage.session.clock })
  return put(stage, body, new BoatSprite(body, views(stage)))
}

/** The German S-boat lies still in the middle, bow to the left. */
const sBoat = stage => {
  const body = new SBoat({ ...at(stage, .5, .5), clock: stage.session.clock })
  return put(stage, body, new SBoatSprite(body, views(stage)))
}

/** A machine-gun nest in the middle, as on the far bank, facing the water below. */
const nest = stage => {
  const body = new ShoreMachineGun({ ...at(stage, .5, .5), side: -1, clock: stage.session.clock })
  return put(stage, body, new ShoreMachineGunSprite(body, views(stage)))
}

const game = 'Čamac'

export const boats = [
  { id: 'partizanski-camac', name: 'Partizanski čamac', game, pxPerMeter, settings: ['boat.thrust', 'boat.turn', 'boat.reload', 'boat.damage', 'boat.health'], block: boatModule, create: boat },
  { id: 'schnellboot', name: 'Schnellboot S-30', game, pxPerMeter, settings: ['sBoat.cruise', 'sBoat.burst', 'sBoat.burstWait', 'sBoat.damage', 'sBoat.health'], block: sBoatModule, create: sBoat },
]

export const artillery = [
  { id: 'mitraljesko-gnezdo', name: 'Mitraljesko gnezdo', game, pxPerMeter, settings: ['nest.turn', 'nest.burst', 'nest.burstWait', 'nest.damage', 'nest.health'], block: shoreMachineGunModule, create: nest },
]
