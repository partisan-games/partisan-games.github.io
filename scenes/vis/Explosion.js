import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import { settings } from './settings.js'

const { duration, scale } = settings.explosion
const frameSize = 128 // px, one of the eight frames in the image

/** One burst of fire and smoke that plays once and hides; the player's bomb reuses them. */
export default class Explosion extends Sprite {
  /** How far from its center the fire of a burst reaches. */
  static reach = frameSize * scale / 2

  constructor() {
    super('sprites/efekti/eksplozija-01.png', { names: ['burst'], frameCount: 8, animationTime: duration })
    this.scaleX = this.scaleY = scale
    this.position.z = -1 // above the planes
    this.hide()
  }

  // a burst can start before its image has loaded, and the animation only exists after that
  onload() {
    super.onload()
    this.setAnimation('burst', false)
  }

  start(x, y) {
    this.setPosition(x, y)
    this.age = 0
    this.show()
    this.reset()
  }

  // by its own clock, so a burst also ends before its image has loaded
  update(dt) {
    super.update(dt)
    this.age += dt
    if (this.age >= duration) this.hide()
  }

  /** Sprite draws every frame at its own size and even when hidden. */
  render() {
    if (!this.shown) return

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.scaleX, this.scaleY)
    this.drawFrame()
    ctx.restore()
  }
}
