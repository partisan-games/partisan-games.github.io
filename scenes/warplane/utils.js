import * as THREE from 'three'
import { createWarehouse, createWarehouse2, createWarRuin, createRuin, createAirport } from '/core3d/city.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import Building from '/core/gameplay/bodies/buildings/Building.js'
import Tower from '/core/gameplay/bodies/buildings/Tower.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel, factoryModel, factoryChimney } from '/core3d/actor/buildings/buildingModels.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'

const { randInt } = THREE.MathUtils

/** A building of `kind` drawn as `mesh`, standing on the ground: its body, as big as the mesh, and its model. */
const make = (Body, kind, mesh, options, look = {}) => {
  const size = modelSize(mesh)
  const body = new Body({ kind, size, y: size.height / 2, ...options })
  return { body, model: new BuildingModel(body, { mesh, ...look }) }
}

/** A building for the time `time` into the flight: more towers the longer it lasts. Towers fire at `targets`. */
export async function createBuilding(time, { clock, targets }) {
  const minutes = Math.floor(time / 60)
  switch (randInt(1, 7 + minutes)) {
    case 1:
      await requestModels([factoryModel])
      return make(Building, 'factory', loadedModel(factoryModel), {}, { chimney: factoryChimney })
    case 2: return make(Building, 'building', createAirport())
    case 3: return make(Building, 'civil', createWarRuin())
    case 4: return make(Building, 'civil', createRuin())
    case 5: return make(Building, 'building', createWarehouse())
    case 6: return make(Building, 'building', createWarehouse2())
    default:
      await requestModels([towerModel])
      return make(Tower, 'tower', loadedModel(towerModel), { clock, targets })
  }
}
