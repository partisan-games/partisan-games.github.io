import Aircraft, * as aircraftModule from '/scenes/to-trieste/Aircraft.js'
import Bunker, * as bunkerModule from '/scenes/to-trieste/Bunker.js'
import * as groundEnemiesModule from '/scenes/to-trieste/GroundEnemies.js'
import { enemyAircraftArt, groundEnemyArt } from '/scenes/to-trieste/enemyArt.js'
import { put } from './helpers.js'

const { GroundEnemy, profiles } = groundEnemiesModule

/** The enemies of Do Trsta fight the tank on the road, so the target, which their shots hit, stands on the ground. */
const onRoad = stage => {
  stage.target.setPosition(stage.width / 2, stage.groundY - stage.target.height / 2)
  return { clock: stage.session.clock, target: stage.target, groundY: stage.groundY }
}

/** A plane flies level over the right of the view and on out of it. */
const plane = kind => stage => {
  const block = put(stage, new Aircraft({ ...onRoad(stage), kind, art: enemyAircraftArt[kind] }))
  block.launch()
  block.x = stage.width * .8
  return block
}

/** A ground enemy stands right of the target, and comes back from the right if it drives out of the view. */
const ground = kind => stage => put(stage, new GroundEnemy({
  ...onRoad(stage), ...profiles.find(profile => profile.kind === kind), art: groundEnemyArt[kind], scrollSpeed: 0,
  x: stage.width * .8, nextSpawnX: () => stage.width + 200,
}))

/** A bunker stands right of the target, at the size the game gives it: its picture's, scaled. */
const bunker = (src, scale, [width, height]) => stage =>
  put(stage, new Bunker({ ...onRoad(stage), src, width: width * scale, height: height * scale, x: stage.width * .8 }))

const game = 'Do Trsta'

export const aircraft = [
  { id: 'bf109-do-trsta', name: 'Bf 109, lovac', game, block: aircraftModule, create: plane('fighter') },
  { id: 'ju87', name: 'Ju 87, obrušavajući bombarder', game, block: aircraftModule, create: plane('diveBomber') },
]

export const vehicles = [
  { id: 'nemacki-tenk-do-trsta', name: 'Nemački tenk', game, block: groundEnemiesModule, create: ground('germanTank') },
  { id: 'somua-s35', name: 'Somua S35', game, block: groundEnemiesModule, create: ground('tank') },
  { id: 'opel-blitz-do-trsta', name: 'Opel Blitz', game, block: groundEnemiesModule, create: ground('truck') },
]

export const artillery = [
  { id: 'pak38', name: 'PaK 38', game, block: groundEnemiesModule, create: ground('antiTankGun') },
  { id: 'kuca-bunker', name: 'Kuća-bunker', game, block: bunkerModule, create: bunker('buildings/kuca-bunker.png', .33, [428, 286]) },
  { id: 'bunker-do-trsta', name: 'Bunker', game, block: bunkerModule, create: bunker('buildings/bunker-02.png', .5, [246, 93]) },
]
