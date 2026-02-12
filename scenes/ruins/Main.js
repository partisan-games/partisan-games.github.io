import Scena3D from '/core/Scena3D.js'
import { baseControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveDivision } from '/core3d/mazes/algorithms.js'
import { hemLight } from '/core3d/light.js'
import { createDunes } from '/core3d/ground.js'
import { WitchPlayer } from '/core3d/actor/derived/fantasy/Witch.js'

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      uiStyle: 'rpg',
      controlKeys: baseControls,
    })
  }

  async init() {
    hemLight({ scene: this.scene })
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'
    const maze = new Maze({ columns: 10, rows: 20, algorithm: recursiveDivision, cellSize: 10 })
    const ruins = maze.toMesh()
    this.addMesh(ruins)

    const dunes = await createDunes()
    this.addMesh(dunes)

    const player = new WitchPlayer({ camera: this.camera, solids: [dunes, ruins] })
    player.chaseCamera.zoomIn()
    this.add(player)
  }
}
