import { Vector2 } from 'three'
import Input from '/core/io/Input.js'
import { Flame } from '/core3d/Particles.js'
import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'
import { frames } from '/core/konstante.js'

/** What to load; the game awaits requestModel(model) in init(), before it creates the lander. */
export const model = { file: 'space/lunar-module/model.fbx', size: 2.5 }

const lowerBound = -30

/**
 * Its thrust, fuel and gravity were tuned per frame at 30 frames per second; scaled by frames(dt),
 * and run in the scene's fixed steps, it flies the same at any refresh rate.
 */
export default class Lander extends GameObject {
  constructor({ platform, mesh = loadedModel(model) }) {
    super({ mesh })
    this.name = 'player'
    this.input = new Input()
    this.platform = platform
    this.flame = new Flame()
    this.flame.mesh.rotateX(Math.PI * .5)
    this.reset()
  }

  /* GETTERS */

  get onPlatform() {
    return this.platform.playerOnPlatform
  }

  get hasLanded() {
    return this.onPlatform && !this.failure
  }

  get broken() {
    return this.onPlatform && this.failure
  }

  get outOfFuel() {
    return !this.fuel && this.position.y < this.platform.position.y
  }

  get lost() {
    return this.position.y < lowerBound
  }

  /* METHODS */

  reset() {
    this.fuel = 300
    this.position.set(0, 5, 0)
    this.mesh.rotation.z = 0
    this.velocity = new Vector2()
    this.failure = false
    this.resetFlame()
  }

  handleInput(delta) {
    if (this.onPlatform) return
    const { input } = this
    const share = frames(delta)

    if (this.fuel >= .5 * share) {
      if (input.left) {
        this.resetFlame(-Math.PI * .5, [-1.75, 1.5, 0])
        this.applyForce(0, .1 * share)
        this.fuel -= .5 * share
      }
      if (input.right) {
        this.resetFlame(Math.PI * .5, [1.75, 1.5, 0])
        this.applyForce(Math.PI, .1 * share)
        this.fuel -= .5 * share
      }
    }

    if (this.fuel >= share && input.down) {
      this.resetFlame(0, [0, -1, 0])
      this.applyForce(Math.PI / 2, .09 * share)
      this.fuel -= share
    }
  }

  resetFlame(angle, pos) {
    this.mesh.add(this.flame.mesh)
    this.flame.reset({ pos, randomize: false })
    this.flame.mesh.rotation.y = angle
    this.shouldLoop = true
  }

  doFailure() {
    this.failure = true
    this.mesh.rotation.z = Math.PI * .5
    this.resetFlame(Math.PI * .5, [0, 1.25, 0])
  }

  checkLanding() {
    if (!this.onPlatform) return

    if (this.velocity.y < -2.4)
      this.doFailure()
    else
      this.shouldLoop = false

    this.velocity.set(0, 0)
  }

  applyForce(angle, thrust) {
    this.velocity.add({ x: thrust * Math.cos(angle), y: thrust * Math.sin(angle) })
  }

  /* UPDATES */

  applyGravity(delta) {
    this.applyForce(-Math.PI / 2, .01625 * frames(delta))
  }

  applyVelocity(delta) {
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta
  }

  updateFlame(delta, t) {
    if (!this.input.keyPressed || !this.fuel) this.shouldLoop = false
    if (this.failure) this.shouldLoop = true
    this.flame.update(delta, t, { max: 3, loop: this.shouldLoop })
  }

  update(delta, t) {
    this.handleInput(delta)
    this.checkLanding()

    if (!this.onPlatform) this.applyGravity(delta)
    this.applyVelocity(delta)
    this.updateFlame(delta, t)
  }

  end() {
    this.input.end()
  }
}
