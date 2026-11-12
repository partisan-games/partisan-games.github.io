import * as THREE from 'three'
import Input from '/core/io/Input.js'
import { getMesh, getGroundY } from '/core3d/helpers.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import GameObject from '/core3d/objects/GameObject.js'
import { FPS, frames } from '/core/konstante.js'

// turns, speed changes and settling are per frame at 60 frames per second, scaled by frames(dt)
const yawAngle = .01
const pitchAngle = yawAngle / 5

/** The share that is left after `share` a frame goes away for the frames in dt. */
const decay = (share, delta) => Math.pow(1 - share, frames(delta))
const maxRoll = Infinity

export default class Airship extends GameObject {
  constructor({
    mesh, speed = 1, maxSpeed = speed * 2.5, minSpeed = speed * .1, minHeight = 2, minDistance = 10, maxPitch = .1, animations, solids, camera, pos, altitude = minHeight * 3, name, showCameraButton
  } = {}) {
    super({ mesh, pos, solids, altitude, name })
    this.speed = speed
    this.speedFactor = speed * .01
    this.maxSpeed = maxSpeed
    this.minSpeed = minSpeed
    this.minHeight = minHeight
    this.minDistance = minDistance
    this.maxPitch = maxPitch
    this.groundY = 0
    this.t = 0
    this.propellers = []
    this.mixer = new THREE.AnimationMixer(getMesh(this.mesh))
    this.mesh.rotation.order = 'YZX' // fix controls (default is 'ZYX')
    this.input = new Input()

    if (animations) {
      const clip = this.animations[0]
      this.action = this.mixer.clipAction(clip)
      this.action.play()
    }

    if (camera) {
      this.chaseCamera = new ChaseCamera({ camera, showCameraButton, mesh: this.mesh, height: 2, speed: this.speed * .5 })
      this.chaseCamera.distance = 6
      this.shouldAlignCamera = true
    }
  }

  /* GETTERS */

  get direction() {
    if (!this.mesh) return { x: 0, y: 0, z: 0 }
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion)
  }

  get groundDistance() {
    return this.mesh.position.y - this.groundY
  }

  get isTouchingGround() {
    return this.groundDistance < this.minHeight
  }

  get isTooLow() {
    return this.groundDistance < this.minHeight * 2
  }

  get isMoving() {
    return this.speed > this.minSpeed
  }

  /* UTILS */

  updateGround() {
    const { solids } = this
    if (!solids) return

    this.groundY = getGroundY({ pos: this.mesh.position, solids })
  }

  normalizeAngles() {
    this.mesh.rotation.x %= Math.PI * 2
    this.mesh.rotation.y %= Math.PI * 2
    this.mesh.rotation.z %= Math.PI * 2
  }

  /* CONTROLS */

  up(delta) {
    if (this.isTouchingGround) this.speed = this.maxSpeed * .5
    this.mesh.translateY(this.speed * delta)
    this.pitch(pitchAngle * frames(delta))
  }

  down(delta) {
    if (this.isTouchingGround) return this.slowDown(.5, delta)
    this.mesh.translateY(-this.speed * delta)
    this.pitch(-pitchAngle * frames(delta))
  }

  left(delta) {
    this.yaw(yawAngle * frames(delta))
  }

  right(delta) {
    this.yaw(-yawAngle * frames(delta))
  }

  pitch(angle) {
    if (angle < 0 && this.mesh.rotation.x < -this.maxPitch) return
    if (angle > 0 && this.mesh.rotation.x > this.maxPitch) return

    this.mesh.rotateX(angle)
  }

  yaw(angle) {
    this.mesh.rotateY(angle)
  }

  roll(angle) {
    if (angle > 0 && this.mesh.rotation.z > maxRoll) return
    if (angle < 0 && this.mesh.rotation.z < -maxRoll) return

    this.mesh.rotateZ(angle)
  }

  moveForward(delta) {
    // https://stackoverflow.com/questions/38052621/
    this.mesh.position.add(this.direction.multiplyScalar(this.speed * delta))
  }

  accelerate(delta) {
    if (this.isTouchingGround) this.up(delta)
    if (this.speed < this.maxSpeed)
      this.speed += this.speedFactor * frames(delta)
  }

  deaccelerate(delta) {
    if (this.speed >= this.minSpeed)
      this.speed -= this.speedFactor * frames(delta)
  }

  /** Keeps `slowFactor` of the speed per frame at 60 frames per second. */
  slowDown(slowFactor, delta) {
    this.speed *= Math.pow(slowFactor, frames(delta))
  }

  /* UPDATES */

  handleInput(delta) {
    if (this.input.left) this.left(delta)
    if (this.input.right) this.right(delta)

    if (this.input.up) this.up(delta)
    if (this.input.down) this.down(delta)

    if (this.input.pressed.PageUp) this.accelerate(delta)
    if (this.input.pressed.PageDown) this.deaccelerate(delta)
  }

  autoHeight(delta) {
    if (!this.isMoving) return
    if (this.isTooLow) this.up(delta)
  }

  /** Without input the airship levels out: it loses a share of its roll and pitch each frame at 60. */
  stabilize(delta) {
    if (this.input.keyPressed) return
    const unroll = 1 - decay(.04, delta)
    const rollAngle = Math.abs(this.mesh.rotation.z)
    if (this.mesh.rotation.z > 0) this.roll(-rollAngle * unroll)
    if (this.mesh.rotation.z < 0) this.roll(rollAngle * unroll)

    const unpitch = 1 - decay(.01, delta)
    const pitchAngle = Math.abs(this.mesh.rotation.x)
    if (this.mesh.rotation.x > 0) this.pitch(-pitchAngle * unpitch)
    if (this.mesh.rotation.x < 0) this.pitch(pitchAngle * unpitch)
  }

  updateMixer(delta) {
    if (!this.mixer || !this.action) return

    this.mixer.update(delta)
    if (this.isTouchingGround) this.action.stop()
    else this.action.play()
  }

  update(delta = 1 / FPS) {
    if (!this.mesh) return

    if (this.t % 3 == 0)
      this.updateGround()
    this.normalizeAngles()
    this.handleInput(delta)
    if (!this.input.down) this.autoHeight(delta)
    this.moveForward(delta)
    this.stabilize(delta)

    if (this.shouldAlignCamera) {
      this.chaseCamera.alignCamera()
      this.shouldAlignCamera = false
    }
    this.chaseCamera?.update(delta)

    this.updateMixer(delta)
    if (!this.isTouchingGround)
      this.propellers.forEach(propeller => propeller.rotateZ(delta * -this.speed))

    this.t++
  }

  end() {
    this.input.end()
    this.chaseCamera?.end()
  }
}
