import { ctx } from '/core/io/canvas2d.js'
import { bodyImage, wreckFor } from './wreckView.js'

/** An atlas body view; the actor keeps its movement, collision size and separate barrel. */
export default class VehicleSprite {
  constructor(art) {
    this.art = art
    wreckFor(art.src)
    this.reset()
  }

  reset() {
    this.elapsed = 0
    this.name = 'idle'
    this.direction = 1
  }

  update(dt, moving, direction = 1, alive = true) {
    const name = moving && alive ? 'drive' : 'idle'
    if (name !== this.name) this.elapsed = 0
    this.name = name
    this.direction = direction
    if (alive) this.elapsed = (this.elapsed + dt) % this.art.clips[name].seconds
    else this.elapsed = 0
  }

  get frameIndex() {
    const frame = Math.floor(this.elapsed / this.art.clips[this.name].seconds * this.art.columns)
    return this.direction < 0 ? (this.art.columns - frame) % this.art.columns : frame
  }

  render(body) {
    if (!body.shown) return
    const { frame, clips, contentBounds } = this.art
    let x = -body.width / 2, y = -body.height / 2, { width } = body, { height } = body
    if (contentBounds) {
      const [left, top, right, bottom] = contentBounds
      const scale = Math.min(body.width / (right - left), body.height / (bottom - top))
      x = -(left + right) / 2 * scale
      y = -(top + bottom) / 2 * scale
      width = frame.width * scale
      height = frame.height * scale
    }
    ctx.save()
    ctx.translate(body.x, body.y)
    ctx.rotate(body.angle)
    ctx.scale(body.flipY * body.scaleX, body.flipX * body.scaleY)
    ctx.imageSmoothingEnabled = false
    if (body.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowOffsetX = ctx.shadowOffsetY = 10
    }
    const image = bodyImage(body), wrecked = image !== body.image
    ctx.drawImage(image, wrecked ? 0 : this.frameIndex * frame.width, wrecked ? 0 : clips[this.name].row * frame.height,
      frame.width, frame.height, x, y, width, height)
    ctx.restore()
    if (body.burning && !body.flameLayer) body.flame.render(body.smoky)
  }
}
