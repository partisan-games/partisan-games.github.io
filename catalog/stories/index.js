import * as franjoKluz from './franjoKluz.js'
import * as ustanak from './ustanak.js'
import * as tenkici from './tenkici.js'
import * as vis from './vis.js'
import * as doTrsta from './doTrsta.js'
import * as camac from './camac.js'
import * as bunker from './bunker.js'
import * as neretva from './neretva.js'
import * as otpisani from './otpisani.js'
import * as characters3d from './characters3d.js'
import * as objects3d from './objects3d.js'
import * as partisans from './partisans.js'
import * as crveniKrst from './crveniKrst.js'
import * as drvar from './drvar.js'

/**
 * The kinds of blocks, each with its stories. A story is one block alone on the stage: `create(stage)` puts it there
 * and gives it back; `block` is the module it comes from; `game` is where the world uses it; `stage` is the stage
 * class it needs, the 2D one by default, and `pxPerMeter` how large it draws a block in metres: the natural scale of its view, from `scales.js`.
 */
export default [
  { id: 'vojnici', title: 'Vojnici', stories: [...franjoKluz.soldiers, ...ustanak.soldiers, ...bunker.soldiers, ...neretva.soldiers, ...otpisani.soldiers, ...partisans.soldiers] },
  { id: 'vozila', title: 'Tenkovi i vozila', stories: [...tenkici.vehicles, ...franjoKluz.vehicles, ...doTrsta.vehicles] },
  { id: 'avioni', title: 'Avioni', stories: [...franjoKluz.aircraft, ...vis.aircraft] },
  { id: 'brodovi', title: 'Brodovi', stories: [...camac.boats] },
  { id: 'artiljerija', title: 'Artiljerija', stories: [...franjoKluz.artillery, ...ustanak.artillery, ...bunker.artillery, ...doTrsta.artillery, ...camac.artillery] },
  { id: 'fantazija-3d', title: '3D fantazija', stories: characters3d.fantasy },
  { id: 'horor-3d', title: '3D horor', stories: characters3d.horror },
  { id: 'drugi-svetski-rat-3d', title: '3D Drugi svetski rat', stories: [...characters3d.ww2, ...drvar.soldiers] },
  { id: 'zivotinje-i-masine-3d', title: '3D životinje i mašine', stories: characters3d.beasts },
  { id: 'letelice-3d', title: '3D letelice', stories: [...objects3d.aircraft, ...drvar.aircraft] },
  { id: 'artiljerija-3d', title: '3D artiljerija', stories: objects3d.artillery },
  { id: 'kule-3d', title: '3D kule sa topom', stories: objects3d.towers },
  { id: 'ambijent-3d', title: '3D ambijent', stories: crveniKrst.props },
]
