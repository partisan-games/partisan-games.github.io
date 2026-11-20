import * as franjoKluz from './franjoKluz.js'
import * as ustanak from './ustanak.js'
import * as tenkici from './tenkici.js'

/**
 * The kinds of blocks, each with its stories. A story is one block alone on the stage: `create(stage)` puts it there
 * and gives it back; `block` is the module it comes from; `game` is where the world uses it.
 */
export default [
  { id: 'vojnici', title: 'Vojnici', stories: [...franjoKluz.soldiers, ...ustanak.soldiers] },
  { id: 'vozila', title: 'Tenkovi i vozila', stories: [...tenkici.vehicles, ...franjoKluz.vehicles] },
  { id: 'avioni', title: 'Avioni', stories: [...franjoKluz.aircraft] },
]
