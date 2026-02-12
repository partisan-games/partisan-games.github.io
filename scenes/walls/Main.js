import Scena3D from '/core/Scena3D.js'
import { avatarControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { SorceressPlayer } from '/core3d/actor/derived/fantasy/Sorceress.js'

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      controlKeys: avatarControls,
      intro: 'Find the way out',
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'
    this.addMesh(createSun())
    this.addMesh(createGround())

    const maze = new Maze(4, 8, recursiveBacktracker, 5)
    const walls = maze.toTiledMesh({ texture: 'walls/stonetiles.jpg', maxHeight: 6 })
    this.addMesh(walls)

    const player = new SorceressPlayer({ camera: this.camera, solids: walls })
    player.chaseCamera.distance = 1.5
    player.putInMaze(maze)
    this.add(player)
  }

  sceneUI(t) {
    return this.ui.scoreUI('Time', Math.round(t))
  }
}
