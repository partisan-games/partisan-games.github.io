import Mitraljezac, * as mitraljezacModule from '/scenes/bunker/Mitraljezac.js'
import Grenadier, * as grenadierModule from '/core/actor/derived/Grenadier.js'
import { fromAbove, put } from './helpers.js'

/** The gunner lies in the middle of the view, his rounds flying at the target. */
const gunner = stage => {
  fromAbove(stage)
  return put(stage, new Mitraljezac({ x: stage.width / 2, y: stage.height / 2, targets: [stage.target], session: stage.session }))
}

/** The player's grenadier, driven by the game's keys. */
const grenadier = stage => {
  fromAbove(stage)
  return put(stage, new Grenadier({ x: stage.width / 2, y: stage.height / 2 }))
}

const game = 'Bunker'

export const soldiers = [
  { id: 'mitraljezac', name: 'Nemački mitraljezac', game, block: mitraljezacModule, create: gunner },
  { id: 'bombas', name: 'Bombaš', game, block: grenadierModule, create: grenadier },
]

