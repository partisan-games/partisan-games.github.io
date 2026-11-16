import GameObject2D from '/core/actor/GameObject2D.js'
import { randomInRange } from '/core/utils.js'

export default class Projectile extends GameObject2D {
  constructor({ src = 'items/granata.gif', scale = .5, gravity = 0, thrust = 500, ...rest } = {}) {
    super(src, { scale, ...rest })
    this.gravity = gravity
    this.thrust = thrust
    this.damage = randomInRange(10, 20)
    this.reset()
  }

  reset() {
    this.vanish()
  }

  launch(poz, angle, thrust = this.thrust) {
    this.setPosition(poz.x, poz.y)
    this.angle = angle
    this.show()
    this.addForce(thrust)
  }

  checkBounds() {
    if (this.offScreen) this.reset()
  }

  checkHit(cilj, callback) {
    if (cilj.collidesWith(this))
      this.hit(cilj, callback)
  }

  hit(cilj, callback) {
    if (cilj.takeHit)
      cilj.takeHit(this.damage)
    else
      cilj.die()
    this.reset()
    if (callback) callback()
  }

  updateAngle() {
    this.angle = Math.atan2(this.dy, this.dx)
  }

  update(dt) {
    if (!this.shown) return

    if (this.gravity) {
      this.addForce(this.gravity * dt, Math.PI / 2)
      this.updateAngle()
    }
    super.update(dt)
  }
}
