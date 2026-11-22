import Boat, * as boatModule from '/core/gameplay/bodies/boats/Boat.js'
import SBoat, * as sBoatModule from '/core/gameplay/bodies/boats/SBoat.js'
import ShoreMachineGun, * as shoreMachineGunModule from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'
import BoatSprite from '/core/actor/boats/BoatSprite.js'
import SBoatSprite from '/core/actor/boats/SBoatSprite.js'
import PatrolBoat, * as patrolBoatModule from '/core/gameplay/bodies/boats/PatrolBoat.js'
import PatrolBoatSprite from '/core/actor/boats/PatrolBoatSprite.js'
import ShoreMachineGunSprite from '/core/actor/artillery/ShoreMachineGunSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'
import SeaMine, * as seaMineModule from '/core/gameplay/bodies/boats/SeaMine.js'
import SeaMineSprite from '/core/actor/boats/SeaMineSprite.js'

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

const game = 'Partisan Navy'

export const boats = [
  { id: 'partizanski-camac', name: 'Partizanski čamac', game, pxPerMeter, block: boatModule, create: boat },
  { id: 'schnellboot', name: 'Schnellboot S-30', game, pxPerMeter, block: sBoatModule, create: sBoat },
  { id: 'nemacko-patrolno-plovilo', name: 'Nemačko patrolno plovilo', game, pxPerMeter, block: patrolBoatModule,
    looks: [['german-launch', 'Patrolni čamac'], ['german-skiff', 'Mali čamac'], ['german-patrol-vessel', 'Patrolni brod'],
      ['rboot', 'Minolovac R-boot'], ['mfp', 'Desantna teglenica MFP'], ['vorpostenboot', 'Naoružani ribarski brod']]
      .map(([id, name]) => ({ id, name, value: id })),
    create(stage, way, id = 'german-launch') {
      const body = new PatrolBoat({ ...at(stage, .5, .5), kind: patrolBoatModule.patrolBoatKinds[id], clock: stage.session.clock })
      return put(stage, body, new PatrolBoatSprite(body, { id, ...views(stage) }))
    },
  },
  { id: 'morska-mina', name: 'Morska mina', game, pxPerMeter, block: seaMineModule,
    create(stage) {
      const body = new SeaMine(at(stage, .5, .5))
      return put(stage, body, new SeaMineSprite(body, views(stage)))
    } },
]

export const artillery = [
  { id: 'mitraljesko-gnezdo', name: 'Mitraljesko gnezdo', game, pxPerMeter, block: shoreMachineGunModule, create: nest },
]
