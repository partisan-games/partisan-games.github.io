import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import { loadModel } from '/core3d/loaders.js'
import { createHillyTerrain, createWater } from '/core3d/ground.js'
import { getEmptyCoords, putOnSolids } from '/core3d/helpers.js'
import { createTreesOnTerrain } from '/core3d/geometry/trees.js'
import makeDirigible, { models as dirigibleModels } from '/core3d/aircraft/derived/Dirigible.js'
import AirshipKeys from '/core/gameplay/controllers/AirshipKeys.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import Input from '/core/io/Input.js'
import { requestModels } from '/core3d/assets/models.js'
import Cloud, { models as cloudModels } from '/core3d/objects/Cloud.js'
import AerialScrew, { models as aerialScrewModels } from '/core3d/objects/AerialScrew.js'
import WizardIsle, { models as wizardIsleModels } from '/core3d/objects/WizardIsle.js'

const controlKeys = {
  '← or A': 'left',
  '→ or D': 'right',
  '↑ or W': 'up',
  '↓ or S': 'down',
  'PgUp': 'speed up',
  'PgDn': 'slow down',
}
const mapSize = 800

export default class ZeppelinScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      uiStyle: 'rpg',
      controlKeys,
    })
  }

  async init() {
    await requestModels([...cloudModels, ...aerialScrewModels, ...wizardIsleModels])
    this.addMesh(createSun({ intensity: Math.PI * 2, pos: [75, 140, -75], r: 5 }))

    const terrain = await createHillyTerrain({ size: mapSize, factorY: 30 })
    this.addMesh(terrain)

    const water = createWater({ size: mapSize * 10 })
    this.addMesh(water)

    const coords = getEmptyCoords({ mapSize: mapSize * .75, fieldSize: 40, emptyCenter: 50 })

    const [castle] = await Promise.all([
      loadModel({ file: 'building/castle/magic-castle.fbx', size: 100 }),
      requestModels(dirigibleModels),
    ])
    putOnSolids(castle, terrain)
    this.addMesh(castle)

    // the dirigible starts 20 m above the ground, south of the castle
    const { groundAt } = worldQueries([terrain, castle])
    const { body, model } = makeDirigible({ z: 200, groundAt })
    body.y = groundAt(body.x, body.z) + 20 + body.size.height / 2
    this.controllers.push(new AirshipKeys(body, new Input()))
    this.audioPlayer = () => model
    const chase = new ChaseCamera({ camera: this.camera, showCameraButton: true, mesh: model.mesh, height: 2, speed: .5 })
    chase.distance = 6
    model.update(0)
    chase.alignCamera()
    this.add(body, model, { update: dt => chase.update(dt), end: () => chase.end() })

    const treesCoords = getEmptyCoords({ mapSize: mapSize * .5, fieldSize: 4, emptyCenter: 50 })
    const trees = createTreesOnTerrain({ terrain, n: 100, size: 6, coords: treesCoords })
    this.addMesh(trees)

    for (let i = 0; i < 10; i++) {
      const cloud = new Cloud({ mapSize: mapSize * 2, pos: coords.pop() })
      this.add(cloud)
    }

    for (let i = 0; i < 8; i++) {
      const screw = new AerialScrew({ pos: coords.pop(), solids: terrain, altitude: 20 + 20 * Math.random() })
      this.add(screw)
    }

    const isle = new WizardIsle({ pos: coords.pop(), solids: terrain, altitude: 40 })
    this.add(isle)
  }
}
