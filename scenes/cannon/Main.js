import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround } from '/core3d/ground.js'
import { createSideWall } from '/core3d/geometry/index.js'
import { CannonPlayer } from '/core3d/actor/derived/Cannon.js'

const controlKeys = {
  'Mouse down': 'add force',
  'Mouse up': 'shoot'
}

export default class extends Scena3D {
  constructor() {
    super({
      intro: 'Demolish the wall — leave no stone on stone.',
      toon: true,
      controlKeys,
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.player = new CannonPlayer({ camera: this.camera })
    this.player.chaseCamera.distance = 2.5
    this.player.chaseCamera.height = 2
    this.player.chaseCamera.lookAt = [0, 2, 0]
    this.add(this.player)

    const sun = createSun({ pos: [-5, 10, 5] })
    this.addMesh(sun)

    this.world = new PhysicsWorld({ scene: this.scene })
    const ground = createGround({ size: 40 })
    this.world.add(ground, 0)

    this.boxes = createSideWall({ rows: 9, columns: 10, brickMass: 3, friction: 5, z: -9 })
    this.boxes.forEach(mesh => this.world.add(mesh))
  }

  handleClick(e) {
    super.handleClick(e)
    if (e.target.closest('button')) return

    this.player.shoot(this.world)
    if (this.player.shots == 0) this.checkDefeat()
  }

  checkDefeat() {
    setTimeout(() => {
      if (this.countableCrates.length > 0)
        this.defeat('You are out of ammo.')
    }, 2000)
  }

  /* LOOP */

  update(dt, t) {
    super.update(dt, t)

    this.world.update(dt)
    this.countableCrates = this.boxes.filter(mesh => mesh.position.y > .5)

    if (!this.countableCrates.length)
      this.victory('You demolished everything.', 'Bravo!')
  }

  sceneUI() {
    return this.ui.scoreUI('Blocks left', this.countableCrates.length, 'Shots left', this.player.shots)
  }
}
