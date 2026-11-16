import GameObject2D from '/core/actor/GameObject2D.js'
import { canvas2d } from '/core/io/canvas2d.js'
import Projectile from './Projectile.js'

const explosionDuration = .15 // seconds

const nearGround = () => canvas2d.height - Math.random() * canvas2d.height * 0.2

export default class Shell extends Projectile {
  constructor({ clock, scale = .5, groundLevel = nearGround(), gravity = 98, ...rest } = {}) {
    super({ scale, ...rest })
    this.clock = clock
    this.groundLevel = groundLevel
    this.gravity = gravity
    this.timerId = null
    this.smallFlame = new GameObject2D('plamen.gif', { scale: 0.4 })
    this.children.push(this.smallFlame)
    this.reset()
  }

  reset() {
    super.reset()
    if (this.timerId) this.clock.cancel(this.timerId) // Metak resets before the clock is set
    this.timerId = null
    this.smallFlame?.hide()
  }

  checkBounds() {
    if (this.timerId) return
    if (this.offScreen || this.y > this.groundLevel) this.reset()
  }

  checkHit(cilj) {
    if (this.timerId || !cilj.collidesWith(this)) return

    this.stop()
    this.explode()

    if (!this.timerId) {
      const { lifeId } = cilj
      this.timerId = this.clock.after(explosionDuration, () => {
        // A recycled target is a new life; the old hit must not follow it.
        if (lifeId !== undefined && (cilj.lifeId !== lifeId || cilj.dead)) {
          this.reset()
          return
        }
        this.hit(cilj)
      })
    }
  }

  explode() {
    this.smallFlame.position = this.position
    this.smallFlame.show()
  }

  update(dt) {
    // Keep the confirmed impact still until its delayed damage resolves.
    if (this.timerId) return
    super.update(dt)
  }
}
