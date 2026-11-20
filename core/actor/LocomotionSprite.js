import { ctx } from '/core/io/canvas2d.js'
import Renderer2D from '/core/Renderer2D.js'

/** A top-down body's movement loop; its actor alone owns displacement, steering and collision geometry. */
export default class LocomotionSprite {
  constructor(art) {
    this.art = art
    this.idle()
  }

  idle() {
    this.moving = false
    this.elapsed = 0
  }

  update(dt, moving) {
    if (dt <= 0) return
    if (moving !== this.moving) this.elapsed = 0
    this.moving = moving
    if (moving) this.elapsed = (this.elapsed + dt) % this.art.seconds
  }

  get frameIndex() {
    return this.moving ? Math.min(3, Math.floor(this.elapsed / this.art.seconds * 4)) : 0
  }

  render(body) {
    if (!body.shown || !body.image.naturalWidth) return
    if (body.debug) return Renderer2D.instance.drawObject(body)
    const { width, height } = this.art.frame
    ctx.save()
    ctx.translate(body.x, body.y)
    ctx.rotate(body.angle)
    ctx.scale(body.flipY * body.scaleX, body.flipX * body.scaleY)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(body.image, this.frameIndex*width, this.moving ? height : 0, width, height,
      -body.width/2, -body.height/2, body.width, body.height)
    ctx.restore()
  }
}
