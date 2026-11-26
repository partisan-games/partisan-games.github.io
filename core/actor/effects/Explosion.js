import GameObject2D from '/core/actor/GameObject2D.js'
import atlasFrame from '/core/actor/atlasFrame.js'
import { ctx } from '/core/io/canvas2d.js'
import { outsideView } from '/core/actor/worldView.js'

/** Turns the fireball black and grey, as the smoke of a shell burst. */
const smokeFilter = 'grayscale(1) brightness(.35) contrast(1.2)'
/** Seconds one burst lasts. */
const duration = 1
/** The size of one of the eight frames of the picture, in pixels. */
const frameSize = 128
const frameCount = 8
const gutter = 4

/** One burst of fire and smoke that plays once and hides. */
export default class Explosion extends GameObject2D {
  /**
   * `scale` is the size against the 128 px frame. A `smoke` burst is the same fireball turned into the black cloud of
   * an anti-aircraft shell. `z` puts it in front of or behind what it bursts among. A burst in world coordinates is
   * judged by its `camera`; one on the screen has none.
   */
  constructor(camera = null, { scale = 2, smoke = false, z = -1.5 } = {}) {
    super('game-ready/efekti/eksplozija.webp', {
      width: frameSize * frameCount, height: frameSize,
    })
    this.camera = camera
    this.smoke = smoke
    this.scaleX = this.scaleY = scale
    this.position.z = z
    this.hide()
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
  }

  // A burst also ends if its image has not loaded.
  update(dt) {
    if (!this.visible) return
    super.update(dt)
    this.age += dt
    if (this.age >= duration) this.hide()
  }

  drawFrame() {
    const index = Math.floor(this.age / (duration / frameCount))
    const half = frameSize / 2
    ctx.drawImage(this.image, ...atlasFrame(frameSize, frameSize, index, 0, gutter), -half, -half, frameSize, frameSize)
  }

  render() {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.scaleX, this.scaleY)
    if (this.smoke) ctx.filter = smokeFilter
    this.drawFrame()
    ctx.restore()
  }
}
