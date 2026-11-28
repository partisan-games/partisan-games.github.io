import * as THREE from 'three'
import { createWarehouse } from '/core3d/city.js'
import { loadedModel } from '/core3d/assets/models.js'
import Building from '/core/gameplay/bodies/buildings/Building.js'
import Tower from '/core/gameplay/bodies/buildings/Tower.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel, factoryModel, factoryChimney } from '/core3d/actor/buildings/buildingModels.js'
import { facades } from '/core3d/actor/buildings/FacadeHouse.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import Train, { models as trainModels } from '/core3d/actor/derived/Train.js'
import { assets } from '/config.js'
import { railway, railwayAt } from './route.js'

export const bridgeModel = { file: 'railway/bridge/model.glb', scale: 1 }
/** What the route's landmarks are drawn with, to load before the flight. */
export const landmarkModels = [factoryModel, towerModel, bridgeModel, ...trainModels]

/** The bridge's rails are `deck` metres above its foot, the track's `rails` above the ground. */
const heights = { deck: 7.24, rails: .77 }
/** The fronts of the town's houses, and the tiled roofs that show from above. */
const houseFronts = [facades.white.file, facades.green.file, facades.blue.file]
const houseBack = 'buildings/kraljevo-pixel/building-back.webp'
const roofColor = 0x9c4a34

const textureLoader = new THREE.TextureLoader()
let houseLooks = null

/** The materials of the town's houses, made once: one for each front, the back, and the roof. */
function houseMaterials() {
  const picture = file => {
    const texture = textureLoader.load(assets.textures + file)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    return new THREE.MeshLambertMaterial({ map: texture })
  }
  houseLooks ??= { fronts: houseFronts.map(picture), back: picture(houseBack),
    roof: new THREE.MeshLambertMaterial({ color: roofColor }) }
  return houseLooks
}

/** A town house: a box with its front turned by `turn` from +z, its roof tiled red. */
function createHouse({ width, depth, height, turn, facade }) {
  const { fronts, back, roof } = houseMaterials()
  // the sides of a box: +x, -x, top, bottom, front (+z), back
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), [back, back, roof, back, fronts[facade], back])
  mesh.rotation.y = turn
  return mesh
}

/** The steel spans of a bridge one after another along the railway, its rails `heights.deck` above its foot. */
function createBridge(spans) {
  const group = new THREE.Group()
  for (let i = 0; i < spans; i++) {
    const span = loadedModel(bridgeModel).clone(true)
    // the model's track runs along x; the railway runs along z
    span.rotation.y = Math.PI / 2
    span.position.z = (i - (spans - 1) / 2) * railway.span
    group.add(span)
  }
  return group
}

/** A body of `kind` drawn as `mesh`, as big as the mesh, its foot `base` metres above the ground; and its model. */
function make(Body, kind, mesh, { base = 0, look = {}, ...options } = {}) {
  const size = modelSize(mesh)
  const body = new Body({ kind, size, y: base + size.height / 2, ...options })
  return { body, model: new BuildingModel(body, { mesh, ...look }) }
}

/** The turn of the railway at `u`, for what lies along it. */
const railwayTurn = u => Math.atan2(railwayAt(u - 1) - railwayAt(u + 1), 2)

/**
 * The body and model of a landmark of the route: a house is civil, a factory, a bridge and a train are what the
 * bomber is sent for, a station is neither, and a tower fires at `targets`.
 */
export function createLandmark(thing, { clock, targets }) {
  switch (thing.kind) {
    case 'house': return make(Building, 'civil', createHouse(thing))
    case 'factory': return make(Building, 'factory', loadedModel(factoryModel), { look: { chimney: factoryChimney } })
    case 'station': {
      const mesh = createWarehouse()
      mesh.rotation.y = Math.PI / 2 + railwayTurn(thing.u)
      return make(Building, 'building', mesh)
    }
    case 'train': {
      const { mesh } = new Train(thing.cars)
      mesh.rotation.y = railwayTurn(thing.u)
      return make(Building, 'train', mesh, { base: heights.rails })
    }
    case 'bridge': {
      const mesh = createBridge(thing.spans)
      mesh.rotation.y = railwayTurn(thing.u)
      return make(Building, 'bridge', mesh, { base: heights.rails - heights.deck })
    }
    case 'tower': return make(Tower, 'tower', loadedModel(towerModel), { clock, targets })
  }
}
