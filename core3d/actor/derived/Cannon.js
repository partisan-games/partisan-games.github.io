import * as THREE from 'three'
import Player from '/core3d/actor/Player.js'
import { loadModel } from '/core3d/loaders.js'
import { createSphere } from '/core3d/geometry/index.js'
import { Ammo } from '/core3d/physics/index.js'
import PowerMeter from '/ui/PowerMeter.js'

/* LOADING */

const mesh = await loadModel({ file: 'weapon/cannon/civil-war-cannon.fbx', size: 1.5 })

/* EXTENDED CLASSES */

export class CannonPlayer extends Player {
  constructor(props = {}) {
    // the keyboard also tracks a held pointer, which charges the shot on touch screens too
    super({ mesh, showHealthBar: false, canMove: false, speed: .5, useKeyboard: true, ...props })
    // 0.2 per frame at 60 frames per second, as when the power was a slider
    this.power = new PowerMeter({ min: 10, max: 25, chargePerSecond: 12 })
    this.shots = 20
  }

  shoot = world => {
    if (!this.shots) return

    const ball = createSphere({ r: 0.2, color: 0x202020 })

    const dir = new THREE.Vector3()
    this.mesh.getWorldDirection(dir).negate() // smer topa

    ball.position.copy(this.mesh.position)
      .add({ x: 0, y: this.height * 0.66, z: 0 }) // gore
      .addScaledVector(dir, 1.5)  // ispred

    world.add(ball, 4)

    dir.y += 0.25 // podizanje ugla pucanja
    dir.normalize().multiplyScalar(this.power.value)

    const velocity = new Ammo.btVector3(dir.x, dir.y, dir.z)
    ball.userData.body.setLinearVelocity(velocity)

    this.power.reset()
    this.shots --
  }

  update(dt) {
    super.update(dt)
    if (this.input.pressed.pointer) this.power.charge(dt)
  }

  end() {
    super.end()
    this.power.end()
  }
}
