import MachineGunner, * as machineGunnerModule from '/core/gameplay/bodies/soldiers/MachineGunner.js'
import Grenadier, * as grenadierModule from '/core/gameplay/bodies/soldiers/Grenadier.js'
import MachineGunnerSprite from '/core/actor/soldiers/MachineGunnerSprite.js'
import GrenadierSprite from '/core/actor/soldiers/GrenadierSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'
import Bunker, { gunnerWindow } from '/core/objects/Bunker.js'
import scales from '../scales.js'

/** Bunker is seen from above at 40 px a metre. */
const pxPerMeter = scales.top
const views = stage => {
  fromAbove(stage)
  return { projection: topProjection({ pxPerMeter }), camera: stage }
}
const middle = stage => ({ x: stage.width / 2 / pxPerMeter, z: stage.height / 2 / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The gunner lies at the window of his bunker in the middle of the view, as in the game, his rounds flying at the stand-in. */
const gunner = stage => {
  const bunker = new Bunker({ x: stage.width / 2, y: stage.height / 2 })
  const { projection, camera } = views(stage)
  const body = new MachineGunner({ ...projection.toWorld({ x: bunker.x + gunnerWindow.x, y: bunker.y + gunnerWindow.y }),
    clock: stage.session.clock, targets: [stage.dummy] })
  stage.add(bunker)
  return put(stage, body, new MachineGunnerSprite(body, { projection, camera }))
}

const grenadier = (stage, way = -1) => {
  // a few grenades, to show him out of them
  const body = new Grenadier({ ...middle(stage), grenades: 3 })
  body.facing = way
  return put(stage, body, new GrenadierSprite(body, views(stage)))
}

const game = 'Bunker'

/** The fortified house with its machine gunner in the window, the one bunker block of the library. */
export const artillery = [
  { id: 'kuca-bunker', name: 'Kuća-bunker', game: 'Bunker, Do Trsta', pxPerMeter, block: machineGunnerModule, create: gunner },
]

export const soldiers = [
  { id: 'bombas', name: 'Bombaš', game, pxPerMeter, way: -1, block: grenadierModule, create: grenadier,
    catalogGroup: ['Vojnici', 'Partizani'] },
]
