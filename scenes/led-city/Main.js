import Scene3D from '/core/Scene3D.js'
import { avatarControls } from '/ui/Controls.js'
import { createFloor } from '/core3d/ground.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import makeAvatar from '/core3d/actor/characters/Avatar.js'
import { lead } from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { hemLight } from '/core3d/light.js'
import { createMaterial } from '/core3d/shaders/lightning-led.js'

const cellSize = 3

export default class LedCityScene extends Scene3D {
  constructor() {
    super({
      controlKeys: avatarControls,
      toon: true,
    })
  }

  async init() {
    this.canvasBackground = 'black'
    hemLight({ scene: this.scene })

    this.addMesh(createFloor())

    const maze = new Maze({ rows: 20, algorithm: recursiveBacktracker, cellSize })
    this.material = createMaterial()
    const city = maze.toTiledMesh({ maxHeight: cellSize * 3, material: this.material })
    this.addMesh(city)

    // it starts in the first corridor, facing the middle of the city
    const { body } = lead(this, makeAvatar({ size: .5, ...maze.tilePosition(1, 1), ...worldQueries(city) }),
      { input: { buttonDict: { jump: '' } }, view: { showHealthBar: false, distance: 1.75, speed: 4 } })
    body.face({ x: 0, z: 0 })
  }

  update(dt, t) {
    super.update(dt)
    this.material.uniforms.iTime.value = t * 0.5
  }
}
