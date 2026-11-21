import Patrol, * as patrolModule from '/core/actor/soldiers/Patrol.js'
import WoundedSoldier, * as woundedSoldierModule from '/core/actor/derived/WoundedSoldier.js'
import { fromAbove, put } from './helpers.js'

const patrol = src => stage => {
  fromAbove(stage)
  const block = new Patrol(src)
  block.setPosition(stage.width / 2, stage.height / 2)
  return put(stage, block)
}

/** The wounded partisan, who crawls by the game's keys. */
const wounded = stage => {
  fromAbove(stage)
  return put(stage, new WoundedSoldier(stage.width / 2, stage.height / 2))
}

const game = 'Ranjenik'

export const soldiers = [
  { id: 'nemacka-patrola', name: 'Nemačka patrola', game, block: patrolModule, create: patrol('armies/nemci-patrola.gif') },
  { id: 'italijanska-patrola', name: 'Italijanska patrola', game, block: patrolModule, create: patrol('armies/talijani-patrola.gif') },
  { id: 'ranjeni-partizan', name: 'Ranjeni partizan', game, block: woundedSoldierModule, create: wounded },
]

