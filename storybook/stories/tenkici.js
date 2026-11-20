import TenkLevo, * as tenkLevoModule from '/scenes/tenkici/TenkLevo.js'
import TenkDesno, * as tenkDesnoModule from '/scenes/tenkici/TenkDesno.js'
import TankKeys from '/core/io/controllers/TankKeys.js'
import { leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'

/** Puts `block` on the stage and gives it back. */
const put = (stage, block) => {
  stage.add(block)
  return block
}

/** A tank alone, firing at the target and driven with its player's keys, as in the game. */
const tank = (Tank, keys) => stage => {
  const block = new Tank({
    x: Tank === TenkDesno ? stage.width * .75 : stage.width / 2,
    y: stage.groundY, groundY: stage.groundY, clock: stage.session.clock, xLimit: Infinity,
  })
  block.controller = new TankKeys(block, keys)
  block.targets.push(stage.target)
  return put(stage, block)
}

const game = 'Tenkići'

export const vehicles = [
  { id: 'partizanski-tenk', name: 'Partizanski tenk', game, block: tenkLevoModule, create: tank(TenkLevo, leftPlayerKeys) },
  { id: 'nemacki-tenk', name: 'Nemački tenk', game, block: tenkDesnoModule, create: tank(TenkDesno, rightPlayerKeys) },
]

