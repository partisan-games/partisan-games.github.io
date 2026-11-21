import Patrol, * as patrolModule from '/core/gameplay/bodies/soldiers/Patrol.js'
import WoundedSoldier, * as woundedSoldierModule from '/core/gameplay/bodies/soldiers/WoundedSoldier.js'
import PatrolSprite from '/core/actor/soldiers/PatrolSprite.js'
import LocomotionSprite from '/core/actor/LocomotionSprite.js'
import art from '/core/actor/ranjenikArt.js'
import { topProjection } from '/core/actor/projection.js'
import { fromAbove } from './helpers.js'

/** Ranjenik is seen from above at 10 px a metre. */
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

/** A patrol of the `faction` army, halted in the middle until it is set to search. */
const patrol = faction => stage => {
  const body = new Patrol(middle(stage))
  body.setState('halt')
  return put(stage, body, new PatrolSprite(body, { faction, ...views(stage) }))
}

const wounded = stage => {
  const body = new WoundedSoldier(middle(stage))
  return put(stage, body, new LocomotionSprite(body, { art: art.wounded, ...views(stage) }))
}

const game = 'Ranjenik'

export const soldiers = [
  { id: 'nemacka-patrola', name: 'Nemačka patrola', game, pxPerMeter, block: patrolModule, create: patrol('german') },
  { id: 'italijanska-patrola', name: 'Italijanska patrola', game, pxPerMeter, block: patrolModule, create: patrol('italian') },
  { id: 'ranjeni-partizan', name: 'Ranjeni partizan', game, pxPerMeter, block: woundedSoldierModule, create: wounded },
]
