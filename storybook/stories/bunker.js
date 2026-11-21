import MachineGunner, * as machineGunnerModule from '/core/gameplay/bodies/soldiers/MachineGunner.js'
import Grenadier, * as grenadierModule from '/core/gameplay/bodies/soldiers/Grenadier.js'
import MachineGunnerSprite from '/core/actor/soldiers/MachineGunnerSprite.js'
import GrenadierSprite from '/core/actor/soldiers/GrenadierSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'

/** Bunker is seen from above at 10 px a metre. */
const pxPerMeter = 40
const views = stage => {
  fromAbove(stage)
  return { projection: topProjection({ pxPerMeter }), camera: stage }
}
const middle = stage => ({ x: stage.width / 2 / pxPerMeter, z: stage.height / 2 / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The gunner lies in the middle of the view, his rounds flying at the stand-in. */
const gunner = stage => {
  const body = new MachineGunner({ ...middle(stage), clock: stage.session.clock, targets: [stage.dummy] })
  return put(stage, body, new MachineGunnerSprite(body, views(stage)))
}

const grenadier = stage => {
  const body = new Grenadier(middle(stage))
  return put(stage, body, new GrenadierSprite(body, views(stage)))
}

const game = 'Bunker'

export const soldiers = [
  { id: 'mitraljezac', name: 'Nemački mitraljezac', game, pxPerMeter, block: machineGunnerModule, create: gunner },
  { id: 'bombas', name: 'Bombaš', game, pxPerMeter, block: grenadierModule, create: grenadier },
]
