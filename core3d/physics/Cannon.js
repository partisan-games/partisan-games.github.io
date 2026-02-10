import * as THREE from 'three'
import { Ammo } from '/core3d/physics/index.js'
import { loadModel } from '/core3d/loaders.js'
import Vehicle from '/core3d/physics/Vehicle.js'
import { createSphere } from '/core3d/geometry/index.js'

const mesh = await loadModel({ file: 'weapon/cannon/mortar/mortar.obj', mtl: 'weapon/cannon/mortar/mortar.mtl', size: 1, angle: Math.PI * .5 })

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

export default class Cannon extends Vehicle {
  constructor({ world, ...rest } = {}) {
    super({ mesh, physicsWorld: world.physicsWorld, defaultRadius: .18, wheelFront: { x: .3, y: .12, z: .32 }, wheelBack: { x: .3, y: .18, z: -.56 }, maxEngineForce: 20, mass: 100, ...rest })

    this.world = world
    this.chaseCamera.offset = [0, 1, -2.5]
    this.chaseCamera.lookAt = [0, 1, 0]

    this.range = createInputRange()
    this.minImpulse = this.range.value = this.range.min
    this.maxImpulse = 25
  }

  shoot = () => {
    const angle = this.mesh.rotation.y
    const x = this.range.value * Math.sin(angle)
    const z = this.range.value * Math.cos(angle)

    const distance = .7
    const cannonTop = new THREE.Vector3(distance * Math.sin(angle), 0, distance * Math.cos(angle))

    const pos = this.mesh.position.clone()
    pos.y += 0.5
    pos.add(cannonTop)

    const ball = createSphere({ r: .2, color: 0x202020 })
    ball.position.copy(pos)
    this.world.add(ball, 4)

    ball.userData.body.setLinearVelocity(new Ammo.btVector3(x, this.range.value * .2, z))
    this.backward(this.range.value)
    this.range.value = this.minImpulse
  }

  update(dt) {
    super.update(dt)
    if (this.input.pressed.pointer && this.range.value < this.maxImpulse)
      this.range.value = parseFloat(this.range.value) + .2
  }
}