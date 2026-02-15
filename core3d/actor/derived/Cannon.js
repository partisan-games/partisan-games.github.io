import * as THREE from 'three'
import Player from '/core3d/actor/Player.js'
import { loadModel } from '/core3d/loaders.js'
import { createSphere } from '/core3d/geometry/index.js'
import { Ammo } from '/core3d/physics/index.js'

/* LOADING */

const mesh = await loadModel({ file: 'weapon/cannon/civil-war-cannon.fbx', size: 1.5 })

/* EXTENDED CLASSES */

function createInputRange() {
  const range = document.createElement('input')
  range.type = 'range'
  range.min = 10
  range.max = 25
  range.step = 0.2
  range.style.position = 'absolute'
  range.style.right = '20px'
  range.style.top = '10px'
  document.body.prepend(range)
  return range
}

export class CannonPlayer extends Player {
  constructor(props = {}) {
    super({ mesh, showHealthBar: false, ...props })
    this.range = createInputRange()
    this.minImpulse = this.range.value = this.range.min
    this.maxImpulse = 25
  }

  shoot = world => {
    const ball = createSphere({ r: 0.2, color: 0x202020 })

    const dir = new THREE.Vector3()
    this.mesh.getWorldDirection(dir).negate() // smer topa

    ball.position.copy(this.mesh.position)
      .add({ x: 0, y: this.height * 0.66, z: 0 }) // gore
      .addScaledVector(dir, 1.5)  // ispred

    world.add(ball, 4)

    dir.y += 0.25 // podizanje ugla pucanja
    dir.normalize().multiplyScalar(this.range.value)

    const velocity = new Ammo.btVector3(dir.x, dir.y, dir.z)
    ball.userData.body.setLinearVelocity(velocity)

    this.range.value = this.minImpulse
  }

  update(dt) {
    super.update(dt)
    if (this.input.pressed.pointer && this.range.value < this.maxImpulse)
      this.range.value = parseFloat(this.range.value) + .2
  }
}
