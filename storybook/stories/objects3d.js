import Stage3D from '../Stage3D.js'
import * as biplaneModule from '/core3d/aircraft/derived/Biplane.js'
import * as bomberModule from '/core3d/aircraft/derived/Bomber.js'
import * as f18Module from '/core3d/aircraft/derived/F18.js'
import * as messerschmittModule from '/core3d/aircraft/derived/Messerschmitt.js'
import * as triplaneModule from '/core3d/aircraft/derived/Triplane.js'
import * as dirigibleModule from '/core3d/aircraft/derived/Dirigible.js'
import * as airshipModule from '/core/gameplay/bodies/aircraft/Airship.js'
import * as towerModule from '/core/gameplay/bodies/buildings/Tower.js'
import * as warplaneModule from '/core/gameplay/bodies/aircraft/Warplane.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel } from '/core3d/actor/buildings/buildingModels.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'

/** The warplane low over the stage, flying on in place, far enough ahead for the stage's camera to see it whole. */
const warplane = async(stage, way, look) => {
  await requestModels(look.models)
  const { body, model } = makeWarplane(look.description, { clock: stage.session.clock, height: 3, limit: 10, z: -12 })
  stage.add(body, model)
  return body
}

/** The tower in the middle with its gun on top; with no target in reach, it holds fire. */
const gunTower = async stage => {
  await requestModels([towerModel])
  const mesh = loadedModel(towerModel)
  const size = modelSize(mesh)
  const body = new towerModule.default({ clock: stage.session.clock, size, y: size.height / 2 })
  stage.add(body, new BuildingModel(body, { mesh }))
  return body
}

/** The looks of a warplane: each plane of the game Warplane. */
const planes = [
  ['dvokrilac', 'Dvokrilac', biplaneModule], ['trokrilac', 'Trokrilac', triplaneModule],
  ['mesersmit', 'Mesersmit', messerschmittModule], ['bombarder', 'Bombarder', bomberModule], ['f18', 'F-18', f18Module],
].map(([id, name, value]) => ({ id, name, value }))

export const aircraft = [
  { id: 'ratni-avion-3d', name: 'Ratni avion', game: 'Warplane', block: warplaneModule, stage: Stage3D, looks: planes,
    settings: ['warplane.speed', 'warplane.reload', 'warplane.missileSpeed'], create: warplane },
  { id: 'dirizabl-3d', name: 'Dirižabl', game: 'Zeppelin', block: airshipModule, stage: Stage3D, settings: ['airship.turn', 'airship.throttle', 'airship.max'],
    // the airship flies on alone, rising to its clearance above the floor
    create: async stage => {
      await requestModels(dirigibleModule.models)
      const { body, model } = dirigibleModule.default()
      stage.add(body, model)
      return body
    } },
]

export const towers = [
  { id: 'kula-3d', name: 'Kula sa topom', game: 'Warplane, FPS Airport', block: towerModule, stage: Stage3D,
    settings: ['tower.range', 'tower.interval', 'tower.damage'], create: gunTower },
]
