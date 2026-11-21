import FighterBomber, * as fighterBomberModule from '/core/gameplay/bodies/aircraft/FighterBomber.js'
import AttackPlane, * as attackPlaneModule from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import FighterBomberSprite from '/core/actor/aircraft/FighterBomberSprite.js'
import AttackPlaneSprite from '/core/actor/aircraft/AttackPlaneSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { getAircraft } from '/scenes/vis/aircraft.js'
import { settings } from '/scenes/vis/settings.js'

/** Vis is seen from above at 10 px a metre: the stage draws its blocks so, x across and z down the view. */
const pxPerMeter = 10

/** The view of the stage seen from above, and the middle of the stage `share` of the way down, in metres. */
const fromAbove = stage => ({ projection: topProjection({ pxPerMeter }), camera: stage })
const at = (stage, share) => ({ x: stage.width / 2 / pxPerMeter, z: stage.height * share / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The player's plane in the lower middle of the stage. */
const player = aircraftId => stage => {
  const { size, image } = getAircraft(aircraftId)
  const body = new FighterBomber({ size, ...at(stage, .7), clock: stage.session.clock })
  return put(stage, body, new FighterBomberSprite(body, { src: image, ...fromAbove(stage) }))
}

/** An enemy plane high in the view with its nose down; its rounds fly at the stand-in, below it. */
const enemyPlane = type => stage => {
  const body = new AttackPlane({ kind: attackPlaneModule.attackPlaneKinds[type], ...at(stage, .2), clock: stage.session.clock })
  return put(stage, body, new AttackPlaneSprite(body, { src: settings.enemies[type].images[0], ...fromAbove(stage) }))
}

const game = 'Vis'

export const aircraft = [
  { id: 'vis-spitfire', name: 'Spitfire Mk Vb', game, pxPerMeter, block: fighterBomberModule, create: player('spitfire') },
  { id: 'vis-hurricane', name: 'Hurricane Mk IV', game, pxPerMeter, block: fighterBomberModule, create: player('hurricane') },
  { id: 'vis-breguet', name: 'Breguet 19', game, pxPerMeter, block: fighterBomberModule, create: player('breguet') },
  { id: 'vis-yak', name: 'Yak-1b', game, pxPerMeter, block: fighterBomberModule, create: player('yak') },
  { id: 'vis-lovac', name: 'Nemački lovac', game, pxPerMeter, block: attackPlaneModule, create: enemyPlane('fighter') },
  { id: 'vis-bf110', name: 'Bf 110', game, pxPerMeter, block: attackPlaneModule, create: enemyPlane('heavy') },
  { id: 'vis-he111', name: 'He 111', game, pxPerMeter, block: attackPlaneModule, create: enemyPlane('boss') },
]
