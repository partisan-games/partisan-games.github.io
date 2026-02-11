import Scena3D from '/core/Scena3D.js'
import { avatarControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { huntAndKill } from '/core3d/mazes/algorithms.js'
import { hemLight } from '/core3d/light.js'
import { createMarble } from '/core3d/ground.js'
import Avatar from '/core3d/actor/Avatar.js'

const cellSize = 8
const matrixSize = 12

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      controlKeys: avatarControls,
      intro: 'Find the way out',
    })
  }

  async init() {
    hemLight({ scene: this.scene })
    this.addMesh(await createMarble({ size: cellSize * matrixSize * 2 }))

    const maze = new Maze(matrixSize, matrixSize, huntAndKill, cellSize)
    const pyramid = maze.toPyramid({ texture: 'walls/mayan.jpg' })
    this.addMesh(pyramid)

    const player = new Avatar({ camera: this.camera, solids: pyramid, skin: 'LAVA' })
    player.putInMaze(maze)
    this.add(player)
  }

  sceneUI(t) {
    return this.ui.scoreUI('Time', Math.round(t))
  }
}
