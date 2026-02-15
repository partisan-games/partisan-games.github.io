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
      // intro: 'Demolish all blocks',
      toon: true,
      controlKeys,
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.player = new CannonPlayer({ camera: this.camera })
    this.add(this.player)

    const sun = createSun({ pos: [-5, 10, 5] })
    this.addMesh(sun)

    this.world = new PhysicsWorld({ scene: this.scene })
    const ground = createGround({ size: 40 })
    this.world.add(ground, 0)

    this.boxes = createSideWall({ brickMass: 3, friction: 5, z: -7 })
    this.boxes.forEach(mesh => this.world.add(mesh))
  }

  // shoot = () => {
  //   const pos = this.player.mesh.position.clone()
  //   pos.y += 0.5
  //   ball.position.copy(pos)
  //   this.world.add(ball, 4)

  //   const angle = this.player.mesh.rotation.y
  //   const x = this.range.value * Math.sin(angle)
  //   const z = this.range.value * Math.cos(angle)
  //   ball.userData.body.setLinearVelocity(new Ammo.btVector3(x, this.range.value * .2, z))
  //   this.range.value = this.minImpulse
  // }

  handleClick(e) {
    super.handleClick(e)
    if (!e.target.closest('button'))
      this.player.shoot(this.world)
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
    return this.ui.scoreUI('Blocks left', this.countableCrates.length)
  }
}
