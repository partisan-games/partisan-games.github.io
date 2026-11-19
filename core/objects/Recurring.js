import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'

export default class Recurring extends GameObject2D {
  constructor({ src, groundY, probability = .25, x = Math.random() * canvas2d.width + canvas2d.width, callback, ...rest } = {}) {
    super(src, { x, ...rest })
    this.wrapElapsed = 0
    this.probability = probability
    this.callback = callback
    if (groundY) this.onload = () => this.placeOnGround(groundY)
  }

  reset() {
    this.alive = true
    this.audioRevision = (this.audioRevision ?? 0) + 1
  }

  die() {
    if (this.callback) this.callback()
    this.alive = false
  }

  checkBounds() {
    if (this.wrapElapsed < 1) return

    if (Math.random() > 1 - this.probability) this.reenterFromRight(() => this.reset())

    this.wrapElapsed = 0
  }

  update(dt) {
    this.wrapElapsed += dt
    super.update(dt)
  }
}
