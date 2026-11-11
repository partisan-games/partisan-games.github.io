import Scena3D from '/core/Scena3D.js'
import { baseControls } from '/ui/Controls.js'
import { createFloor } from '/core3d/ground.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import Avatar from '/core3d/actor/Avatar.js'
import { hemLight } from '/core3d/light.js'
import { createMaterial } from '/core3d/shaders/lightning-led.js'

const cellSize = 3

export default class extends Scena3D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Space: 'jump' },
      toon: true,
    })
  }

  async init() {
    this.bojaPlatna = 'black'
    hemLight({ scene: this.scene })

    this.addMesh(createFloor())

    const maze = new Maze({ rows: 20, algorithm: recursiveBacktracker, cellSize })
    this.material = createMaterial()
    const city = maze.toTiledMesh({ maxHeight: cellSize * 3, material: this.material })
    this.addMesh(city)

    const player = new Avatar({ size: .5, camera: this.camera, solids: city })
    player.chaseCamera.distance = 1.75
    player.putInMaze(maze)
    this.add(player)
  }

  update(dt, t) {
    super.update(dt)
    this.material.uniforms.iTime.value = t * 0.5
  }
}
