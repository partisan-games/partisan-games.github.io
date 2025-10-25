import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { ResistanceFighterPlayer } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
import { createFloor } from '/core3d/ground.js'
import { PartisanAI } from '/core3d/actor/derived/ww2/Partisan.js'
import { PartisanAimAI } from '/core3d/actor/derived/ww2/PartisanAim.js'
import { PartisanLowpolyAI } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { SovietPartisanAI } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { sample } from '/core3d/helpers.js'

const cellSize = 10
const rows = 6

export default class BihacScena extends Scena3D {
  constructor(manager) {
    super(manager, { controlKeys: thirdPersonControls, toon: true })
  }

  init() {
    const floor = createFloor({ file: 'terrain/ground.jpg' })
    this.addMesh(floor)
    this.addMesh(createSun({ pos: [50, 100, 50], intensity: 2 * Math.PI }))

    const maze = new Maze({ rows, columns: rows, truePrims, cellSize })
    const city = maze.toGraffitiCity({ texture: 'terrain/concrete.jpg', maxHeight: cellSize * .5 })
    this.addMesh(city)

    const coords = maze.getEmptyCoords(true, cellSize - 1)

    this.player = new ResistanceFighterPlayer({ camera: this.camera, solids: city, pos: coords.pop(), showHealthBar: false })
    this.player.putInMaze(maze)
    this.add(this.player)

    this.comrades = []
    for (let i = 0; i < 10; i++) {
      const AIClass = sample([PartisanAI, PartisanAimAI, PartisanLowpolyAI, SovietPartisanAI])
      const comrade = new AIClass({ pos: coords.pop(), solids: city })
      this.comrades.push(comrade)
      this.add(comrade)
    }
  }

  end() {
    super.end()
    this.comrades = []
  }

}
