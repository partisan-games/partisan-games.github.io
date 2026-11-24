import { separateModels } from './catalogEntries.js'
import FighterBomber, * as fighterBomberModule from '/core/gameplay/bodies/aircraft/FighterBomber.js'
import AttackPlane, * as attackPlaneModule from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import FighterBomberSprite from '/core/actor/aircraft/FighterBomberSprite.js'
import AttackPlaneSprite, { attackPlaneImages } from '/core/actor/aircraft/AttackPlaneSprite.js'
import { topProjection } from '/core/actor/projection.js'
import { fighterBomberPlane, enemyAircraftSize } from '/core/actor/aircraft/fighterBomberPlanes.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import scales from '../scales.js'

/** Vis is seen from above at 10 px a metre: the stage draws its blocks so, x across and z down the view. */
const pxPerMeter = scales.top

/** The view of the stage seen from above, and the middle of the stage `share` of the way down, in metres. */
const fromAbove = stage => ({ projection: topProjection({ pxPerMeter }), camera: stage })
const at = (stage, share) => ({ x: stage.width / 2 / pxPerMeter, z: stage.height * share / pxPerMeter })

const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

/** The player's plane in the middle of the stage. */
const player = aircraftId => stage => {
  const { size, image } = fighterBomberPlane(aircraftId)
  const body = new FighterBomber({ size, performance: modelPerformance[aircraftId], ...at(stage, .5), clock: stage.session.clock })
  return put(stage, body, new FighterBomberSprite(body, { src: image, ...fromAbove(stage) }))
}

/** An enemy plane in the middle with its nose down, drawn as picture `src`; its rounds fly at the stand-in. */
const enemyPlane = type => (stage, way, src = attackPlaneImages[type][0]) => {
  const body = new AttackPlane({ kind: { ...attackPlaneModule.attackPlaneKinds[type], size: enemyAircraftSize(src) },
    ...at(stage, .5), clock: stage.session.clock })
  return put(stage, body, new AttackPlaneSprite(body, { src, ...fromAbove(stage) }))
}

/** The pictures the enemy fighters are drawn as, one picked for each plane in the game. */
const fighterLooks = [['bf109', 'Bf 109'], ['fw190', 'Fw 190'], ['sivi', 'Sivi lovac'], ['pustinjski', 'Pustinjski lovac'],
  ['zeleni', 'Zeleni lovac'], ['zuti-nos', 'Lovac žutog nosa']]
  .map(([id, name], i) => ({ id, name, value: attackPlaneImages.fighter[i] }))

const game = 'Vis'

export const aircraft = [
  { id: 'vis-spitfire', name: 'Spitfire Mk Vb', game, pxPerMeter, block: fighterBomberModule, create: player('spitfire') },
  { id: 'vis-hurricane', name: 'Hurricane Mk IV', game, pxPerMeter, block: fighterBomberModule, create: player('hurricane') },
  { id: 'vis-breguet', name: 'Breguet 19', game, pxPerMeter, block: fighterBomberModule, create: player('breguet') },
  { id: 'vis-yak', name: 'Yak-1b', game, pxPerMeter, block: fighterBomberModule, create: player('yak') },
  // no level flies it yet; it waits in the catalogue for one
  { id: 'il-2', name: 'Il-2', game: 'Zajednička biblioteka', pxPerMeter, block: fighterBomberModule, create: player('il2') },
  { id: 'vis-lovac', name: 'Nemački lovac', game, pxPerMeter, block: attackPlaneModule, looks: fighterLooks, create: enemyPlane('fighter') },
  { id: 'vis-bf110', name: 'Bf 110', game, pxPerMeter, block: attackPlaneModule, create: enemyPlane('heavy') },
  { id: 'vis-he111', name: 'He 111', game, pxPerMeter, block: attackPlaneModule, create: enemyPlane('boss') },
].flatMap(story => story.looks ? separateModels(story) : [story])
