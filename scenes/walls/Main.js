import Scena3D from '/core/Scena3D.js'
import { avatarControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { SorceressPlayer, models as sorceressModels } from '/core3d/actor/derived/fantasy/Sorceress.js'
import { requestModels } from '/core3d/assets/models.js'

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
    await requestModels([...sorceressModels])
    this.addMesh(createSun())
    this.addMesh(createGround())

    this.maze = new Maze({ rows: 20, algorithm: recursiveBacktracker, cellSize: 3 })
    const walls = this.maze.toTiledMesh({ texture: 'walls/stonetiles.jpg', maxHeight: 6 })
    this.addMesh(walls)

    this.player = new SorceressPlayer({ camera: this.camera, solids: walls })
    this.player.chaseCamera.distance = 1.5
    this.player.putInMaze(this.maze)
    this.add(this.player)
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.player.position.distanceTo(this.maze.exitPosition) < this.maze.cellSize)
      this.victory(`You found the way out in ${Math.round(t)} seconds.`)
  }

  sceneUI(t) {
    return this.ui.scoreUI('Time', Math.round(t))
  }
}
