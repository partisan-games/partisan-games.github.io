import WorldPart from '/core/actor/WorldPart.js'
import { ctx } from '/core/io/canvas2d.js'

/**
 * A part drawn from one frame of a horizontal strip of equal frames, such as a turning propeller or a breathing crew.
 * Its owner places it and picks `frame`; the part is the size of one frame times `scale`.
 */
export default class AtlasPart extends WorldPart {
  constructor(src, { frames, scale = 1, ...options }) {
    super(src, { scale, ...options })
    this.frames = frames
    this.partScale = scale
    this.frame = 0
  }

  onload() {
    this.width = this.image.naturalWidth / this.frames * this.partScale
    this.height = this.image.naturalHeight * this.partScale
  }

  render() {
    if (this.shown) this.draw()
  }

  /** Draws the current frame where the part is; an owner that draws the part itself, in its own order, calls this. */
  draw() {
    if (!this.image.naturalWidth) return
    const frameWidth = this.image.naturalWidth / this.frames
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, this.flipX)
    ctx.drawImage(this.image, this.frame * frameWidth, 0, frameWidth, this.image.naturalHeight,
      -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
