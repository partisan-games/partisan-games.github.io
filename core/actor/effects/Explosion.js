import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import { outsideView } from '/core/actor/worldView.js'

/** Turns the fireball black and grey, as the smoke of a shell burst. */
const smokeFilter = 'grayscale(1) brightness(.35) contrast(1.2)'
/** Seconds one burst lasts. */
const duration = 1
/** The size of one of the eight frames of the picture, in pixels. */
const frameSize = 128

/** One burst of fire and smoke that plays once and hides. */
export default class Explosion extends Sprite {
  /**
   * `scale` is the size against the 128 px frame. A `smoke` burst is the same fireball turned into the black cloud of
   * an anti-aircraft shell. `z` puts it in front of or behind what it bursts among. A burst in world coordinates is
   * judged by its `camera`; one on the screen has none.
   */
  constructor(camera = null, { scale = 2, smoke = false, z = -1.5 } = {}) {
    super('sprites/efekti/eksplozija-01.png', { names: ['burst'], frameCount: 8, animationTime: duration })
    this.camera = camera
    this.smoke = smoke
    this.scaleX = this.scaleY = scale
    this.position.z = z
    this.hide()
  }

  // a burst can start before its image has loaded, and the animation only exists after that
  onload() {
    super.onload()
    this.setAnimation('burst', false)
  }

  get offScreen() {
    return this.camera ? outsideView(this, this.camera) : super.offScreen
  }

  /** How far from its center the fire reaches. */
  get reach() {
    return frameSize * this.scaleX / 2
  }

  start(x, y) {
    this.setPosition(x, y)
    this.age = 0
    this.show()
    this.reset()
  }

  // by its own clock, so a burst also ends before its image has loaded
  update(dt) {
    if (!this.visible) return
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
    if (this.smoke) ctx.filter = smokeFilter
    this.drawFrame()
    ctx.restore()
  }
}
