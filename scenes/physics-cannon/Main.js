import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround } from '/core3d/ground.js'
import { createSideWall } from '/core3d/geometry/index.js'
import Cannon from '/core3d/physics/Cannon.js'

const controlKeys = {
  'Mouse down': 'add force',
  'Mouse up': 'shoot'
}

export default class extends Scena3D {
  constructor() {
    super({
      intro: 'Demolish all blocks',
      toon: true,
      controlKeys,
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.world = new PhysicsWorld({ scene: this.scene })

    const sun = createSun({ pos: [-5, 10, 5] })
    this.addMesh(sun)

    const ground = createGround({ size: 40 })
    this.world.add(ground, 0)

    this.boxes = createSideWall({ brickMass: 3, friction: 5, z: 7 })
    this.boxes.forEach(mesh => this.world.add(mesh))

    this.cannon = new Cannon({ world: this.world, camera: this.camera })
    this.addMesh(this.cannon.mesh, ...this.cannon.wheelMeshes)
  }

  handleClick(e) {
    super.handleClick(e)
    if (!e.target.closest('button'))
      this.cannon.shoot()
  }

  /* LOOP */

  update(dt, t) {
    super.update(dt, t)

    this.cannon?.update(dt)
    this.world.update(dt)
    this.countableCrates = this.boxes.filter(mesh => mesh.position.y > .5)

    if (!this.countableCrates.length)
      this.victory('Bravo!<br>You demolished everything.')
  }

  sceneUI() {
    return this.ui.scoreUI('Blocks left', this.countableCrates.length)
  }
}
