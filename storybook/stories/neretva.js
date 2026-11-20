import Svabo, * as svaboModule from '/scenes/neretva/Svabo.js'
import { put } from './helpers.js'

/** A soldier in his trench on the ground line, as near as the near row of the game. */
const trench = faction => stage => {
  const block = new Svabo({ scale: 1, faction })
  block.setPosition(stage.width / 2, stage.groundY)
  return put(stage, block)
}

const game = 'Neretva'

export const soldiers = [
  { id: 'nemac-u-rovu', name: 'Nemac u rovu', game, block: svaboModule, create: trench('nemci') },
  { id: 'cetnik-u-rovu', name: 'Četnik u rovu', game, block: svaboModule, create: trench('cetnici') },
]
