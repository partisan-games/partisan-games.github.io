import Grenadier, * as grenadierModule from '/core/gameplay/bodies/soldiers/Grenadier.js'
import GrenadierSprite from '/core/actor/soldiers/GrenadierSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'
import scales from '../scales.js'
import { playerControls } from '../playerControls.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import GrenadierKeys from '/core/gameplay/controllers/GrenadierKeys.js'

/** Bunker is seen from above at 40 px a metre. */
const pxPerMeter = scales.top
const game = 'Bunker'
const views = stage => {
  fromAbove(stage)
  return { projection: topProjection({ pxPerMeter }), camera: stage }
}
const middle = stage => ({ x: stage.width / 2 / pxPerMeter, z: stage.height / 2 / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The player's grenadier, walked and throwing on the keys and buttons of the game, with grenades to test without end. */
const grenadier = (stage, way = 1) => {
  const body = new Grenadier(middle(stage))
  body.facing = way
  playerControls(stage, input => new GrenadierKeys(body, { input }), inputLayouts.grenadier)
  return put(stage, body, new GrenadierSprite(body, views(stage)))
}

export const soldiers = [
  { id: 'bombas', name: 'Bombaš', game, pxPerMeter, way: 1, block: grenadierModule, create: grenadier,
    catalogGroup: ['Vojnici', 'Partizani'] },
]
