import { keys, attackLabels } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { avatarControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { description as sorceress, models as sorceressModels } from '/core3d/actor/derived/fantasy/Sorceress.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'

export default class WallsScene extends Scene3D {
  // This tour stays free even though it has an introductory screen.
  get free() {
    return true
  }

  constructor() {
    super({
      toon: true,
      controlKeys: { ...avatarControls, [attackLabels.Enter]: 'attack', [keys.attack2.label]: 'secondary attack' },
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

    // she starts in the first corridor, facing the middle of the maze
    this.player = leadCharacter(this, sorceress, { ...this.maze.tilePosition(1, 1), ...worldQueries(walls),
      input: { buttonDict: { attack: icons.magic, attack2: icons.magic } }, view: { distance: 1.5 } }).body
    this.player.face({ x: 0, z: 0 })
  }

  update(dt, t) {
    super.update(dt, t)
    const { x, z } = this.maze.exitPosition
    if (Math.hypot(this.player.x - x, this.player.z - z) < this.maze.cellSize)
      this.victory(`You found the way out in ${Math.round(t)} seconds.`)
  }

  sceneUI(t) {
    return this.ui.scoreUI('Time', Math.round(t))
  }
}
