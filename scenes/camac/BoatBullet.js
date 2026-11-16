import Projectile from '/core/actor/projectiles/Projectile.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'

/** Projectile simulation uses world coordinates; visibility uses the current camera. */
export default class BoatBullet extends Projectile {
  constructor(viewLeft) {
    super({ src: null, width: 10, height: 2, z: -1 })
    this.viewLeft = viewLeft
    this.damage = 10
  }

  reset() {
    super.reset()
    this.start = this.end = null
  }

  get offScreen() {
    const x = this.x - this.viewLeft()
    return x < -this.width || x > canvas2d.width + this.width ||
      this.y < -this.width || this.y > canvas2d.height + this.width
  }

  update(dt) {
    if (!this.visible) return
    if (this.offScreen) { this.reset(); return }
    this.start = { x: this.x, y: this.y }
    this.updateMovement(dt)
    this.end = { x: this.x, y: this.y }
    // Hit resolution precedes retirement, even if this segment leaves the screen.
  }

  render() {
    if (!this.shown) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.fillStyle = '#ffe2a0'
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
