import Scena3D from '/core/Scena3D.js'
import PolarMaze from '/core3d/mazes/PolarMaze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { createSun, ambLight } from '/core3d/light.js'
import { createHill } from '/core3d/ground.js'
import Avatar from '/core3d/actor/Avatar.js'
import { baseControls } from '/ui/Controls.js'

const rows = 20
const cellSize = 10
const mazeSize = rows * cellSize

export default class extends Scena3D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Space: 'jump' },
      toon: true,
    })
  }

  async init() {
    const hill = createHill(mazeSize * 2.05, 164)
    this.addMesh(hill)

    ambLight({ intensity: Math.PI * .6, scene: this.scene })
    const sun = createSun({ pos: [50, 150, 200] })
    this.addMesh(sun)

    const maze = new PolarMaze(rows, recursiveBacktracker, cellSize)
    const city = maze.toCity({ texture: 'terrain/snow.jpg' })
    this.addMesh(city)

    const player = new Avatar({ camera: this.camera, solids: [city, hill] })
    player.chaseCamera.zoomIn()
    this.add(player)
    player.putInPolarMaze(maze)
  }
}
