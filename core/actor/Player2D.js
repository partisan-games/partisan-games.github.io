import { FULL_CIRCLE, frames } from '/core/constants.js'
import GameObject2D from './GameObject2D.js'
import Input from '/core/io/Input.js'

export default class Player2D extends GameObject2D {
  constructor(src, { buttonDict, attackKey, ...rest } = {}) {
    super(src, rest)
    this.tags.add('igrac')
    this.thrust = 31
    this.tankControls = false // true turns the body with left and right instead of moving sideways
    this.solidBodies = []
    this.turnRate = 0.047
    this.frictionFactor = .1
    this.input = new Input({ buttonDict, attackKey })
  }

  handleInput(dt) {
    if (this.input.left) this.moveLeft(dt)
    if (this.input.right) this.moveRight(dt)
    if (this.input.up) this.moveUp(dt)
    if (this.input.down) this.moveDown(dt)
    if (this.input.attack) this.shoot()
  }

  moveLeft(dt) {
    if (this.tankControls)
      this.angle -= this.turnRate * frames(dt, this.tunedFps)
    else
      this.addForce(this.thrust * frames(dt, this.tunedFps), FULL_CIRCLE / 2)
  }

  moveRight(dt) {
    if (this.tankControls)
      this.angle += this.turnRate * frames(dt, this.tunedFps)
    else
      this.addForce(this.thrust * frames(dt, this.tunedFps), 0)
  }

  moveUp(dt) {
    const angle = this.tankControls ? this.angle : -FULL_CIRCLE / 4
    this.addForce(this.thrust * frames(dt, this.tunedFps), angle)
  }

  moveDown(dt) {
    const angle = this.tankControls ? this.angle : FULL_CIRCLE / 4
    const thrust = this.tankControls ? (-this.thrust / 2) : this.thrust
    this.addForce(thrust * frames(dt, this.tunedFps), angle)
  }

  shoot() {} // a player with a weapon fires it here

  update(dt) {
    super.update(dt)
    this.applyFriction(this.frictionFactor, dt)
  }

  end() {
    this.input.end()
  }
}
