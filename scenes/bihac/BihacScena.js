import Scena3D from '/core/Scena3D.js'
import { createGraffitiCity } from '/core3d/city.js'
import { createSun } from '/core3d/light.js'
import { getEmptyCoords } from '/core3d/helpers.js'
import { ResistanceFighterPlayer } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
import { createFloor } from '/core3d/ground.js'

const cellSize = 10
const rows = 20
// const mapSize = 200

export default class BihacScena extends Scena3D {
  constructor(manager) {
    super(manager, { controlKeys: thirdPersonControls, toon: true })
  }

  init() {
    const floor = createFloor({ file: 'terrain/ground.jpg' })
    this.addMesh(floor)
    this.addMesh(createSun({ pos: [50, 100, 50], intensity: 2 * Math.PI }))

    // const city = createGraffitiCity({ scene: this.scene, mapSize, coords })
    // this.addMesh(city)

    const maze = new Maze(rows, rows, truePrims, cellSize)
    const city = maze.toCity({ texture: 'terrain/concrete.jpg', cityTexture: false, maxHeight: cellSize * 2.5 })
    this.addMesh(city)

    const coords = maze.getEmptyCoords(true, cellSize - 1)
    // const coords = getEmptyCoords({ mapSize })

    this.player = new ResistanceFighterPlayer({ camera: this.camera, solids: city, pos: coords.pop(), showHealthBar: false })
    this.player.putInMaze(maze)
    this.add(this.player)
  }
}
