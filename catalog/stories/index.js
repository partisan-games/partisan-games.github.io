import * as franjoKluz from './franjoKluz.js'
import * as ustanak from './ustanak.js'
import * as tenkici from './tenkici.js'
import * as vis from './vis.js'
import * as doTrsta from './doTrsta.js'
import * as camac from './camac.js'
import * as bunker from './bunker.js'
import { scenery } from './scenery.js'
import * as neretva from './neretva.js'
import * as cetnici from './cetnici.js'
import * as otpisani from './otpisani.js'
import * as characters3d from './characters3d.js'
import * as objects3d from './objects3d.js'
import * as partisans from './partisans.js'
import * as props3d from './props3d.js'
import * as drvar from './drvar.js'
import * as advance from './advance.js'

/**
 * The kinds of blocks, each with its stories. A story is one block alone on the stage: `create(stage)` puts it there
 * and gives it back; `block` is the module it comes from; `game` is where the world uses it; `stage` is the stage
 * class it needs, the 2D one by default, and `pxPerMeter` how large it draws a block in metres: the natural scale of its view, from `scales.js`.
 */
export default [
  { id: 'vojnici', title: 'Vojnici', stories: [...franjoKluz.soldiers, ...ustanak.soldiers, ...bunker.soldiers, ...neretva.soldiers, ...cetnici.soldiers, ...otpisani.soldiers, ...partisans.soldiers, ...drvar.soldiers, ...advance.soldiers] },
  { id: 'vozila', title: 'Tenkovi i vozila', stories: [...tenkici.vehicles, ...franjoKluz.vehicles, ...doTrsta.vehicles, ...characters3d.vehicles, ...advance.vehicles] },
  { id: 'avioni', title: 'Avioni', stories: [...franjoKluz.aircraft, ...ustanak.aircraft, ...vis.aircraft, ...drvar.aircraft] },
  { id: 'brodovi', title: 'Brodovi', stories: [...camac.boats] },
  { id: 'artiljerija', title: 'Artiljerija', stories: [...franjoKluz.artillery, ...ustanak.artillery, ...doTrsta.artillery, ...camac.artillery] },
  { id: 'scenografija', title: 'Scenografija', stories: scenery },
  { id: 'drugi-svetski-rat-3d', title: '3D Drugi svetski rat', stories: characters3d.ww2 },
  { id: 'letelice-3d', title: '3D letelice', stories: [...objects3d.aircraft, ...drvar.aircraft3d] },
  { id: 'artiljerija-3d', title: '3D artiljerija', stories: objects3d.artillery },
  { id: 'scenografija-3d', title: '3D scenografija', stories: [...props3d.props, ...objects3d.towers] },
]
