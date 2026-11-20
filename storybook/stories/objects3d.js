import Stage3D from '../Stage3D.js'
import { requestModels } from '/core3d/assets/models.js'
import * as biplaneModule from '/core3d/aircraft/derived/Biplane.js'
import * as bomberModule from '/core3d/aircraft/derived/Bomber.js'
import * as f18Module from '/core3d/aircraft/derived/F18.js'
import * as messerschmittModule from '/core3d/aircraft/derived/Messerschmitt.js'
import * as triplaneModule from '/core3d/aircraft/derived/Triplane.js'
import * as dirigibleModule from '/core3d/aircraft/derived/Dirigible.js'
import * as towerModule from '/core3d/objects/Tower.js'

/**
 * A story of a 3D block made as its games make it, by `make(stage)`, or with no options. A block with models waits
 * for them before it is made.
 */
const story = (id, name, game, block, make = () => new block.default()) => ({
  id, name, game, block, stage: Stage3D,
  create: async stage => {
    if (block.models) await requestModels(block.models)
    const made = make(stage)
    stage.add(made)
    return made
  },
})

/** The player's plane flies on by itself, with the game's keys, the camera behind it, as in Warplane. */
const warplane = Plane => stage => new Plane({ clock: stage.session.clock, camera: stage.camera, limit: 25 })

const warplaneGame = 'Warplane'

export const aircraft = [
  story('dvokrilac-3d', 'Dvokrilac', warplaneGame, biplaneModule, warplane(biplaneModule.default)),
  story('bombarder-3d', 'Bombarder', warplaneGame, bomberModule, warplane(bomberModule.default)),
  story('f18-3d', 'F-18', warplaneGame, f18Module, warplane(f18Module.default)),
  story('mesersmit-3d', 'Mesersmit', warplaneGame, messerschmittModule, warplane(messerschmittModule.default)),
  story('trokrilac-3d', 'Trokrilac', warplaneGame, triplaneModule, warplane(triplaneModule.default)),
  story('dirizabl-3d', 'Dirižabl', 'Zeppelin', dirigibleModule, stage => new dirigibleModule.default({ camera: stage.camera })),
]

export const towers = [
  story('kula-3d', 'Kula sa topom', 'FPS Airport, Warplane', towerModule),
  story('aerodromska-kula-3d', 'Aerodromska kula', 'FPS Airport', towerModule, () => new towerModule.AirportTower(0, 0)),
]
