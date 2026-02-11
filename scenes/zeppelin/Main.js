import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { loadModel } from '/core3d/loaders.js'
import { createHillyTerrain, createWater } from '/core3d/ground.js'
import { getEmptyCoords, putOnSolids } from '/core3d/helpers.js'

const controlKeys = {
  '← or A': 'left',
  '→ or D': 'right',
  '↑ or W': 'up',
  '↓ or S': 'down',
  'PgUp': 'speed up',
  'PgDn': 'slow down',
}

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      uiStyle: 'rpg',
      controlKeys,
    })
  }

  async init() {
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'
    this.updatables = []
    const mapSize = 800

    this.addMesh(createSun({ intensity: Math.PI * 2, pos: [75, 140, -75], r: 5 }))

    const terrain = await createHillyTerrain({ size: mapSize, factorY: 30 })
    this.addMesh(terrain)

    const water = createWater({ size: mapSize * 10 })
    this.addMesh(water)

    const coords = getEmptyCoords({ mapSize: mapSize * .75, fieldSize: 40, emptyCenter: 50 })

    const castle = await loadModel({ file: 'building/castle/magic-castle.fbx', size: 100 })
    putOnSolids(castle, terrain)
    this.addMesh(castle)

    const dirigibleFile = await import('/core3d/aircraft/derived/Dirigible.js')
    const player = new dirigibleFile.default({ camera: this.camera, solids: terrain, cameraClass: 'rpgui-button' })
    player.position.z = 200
    player.solids.push(castle)
    this.addEntity(player)

    const { createTreesOnTerrain } = await import('/core3d/geometry/trees.js')
    const treesCoords = getEmptyCoords({ mapSize: mapSize * .5, fieldSize: 4, emptyCenter: 50 })
    const trees = createTreesOnTerrain({ terrain, n: 100, size: 6, coords: treesCoords })
    this.addMesh(trees)

    const cloudFile = await import('/core3d/objects/Cloud.js')
    for (let i = 0; i < 10; i++) {
      const cloud = new cloudFile.default({ mapSize: mapSize * 2, pos: coords.pop() })
      this.addEntity(cloud)
    }

    const aerialFile = await import('/core3d/objects/AerialScrew.js')
    for (let i = 0; i < 8; i++) {
      const screw = new aerialFile.default({ pos: coords.pop(), solids: terrain, altitude: 20 + 20 * Math.random() })
      this.addEntity(screw)
    }

    const isleFile = await import('/core3d/objects/WizardIsle.js')
    const isle = new isleFile.default({ pos: coords.pop(), solids: terrain, altitude: 40 })
    this.addEntity(isle)

    this.updatables.forEach(gameObj => this.addMesh(gameObj.mesh))
  }

  addEntity(entity) {
    this.addMesh(entity.mesh)
    this.updatables.push(entity)
  }

  /* LOOP */

  update(dt, t) {
    super.update(dt, t)

    this.updatables.forEach(screw => screw.update(dt))
  }

}
