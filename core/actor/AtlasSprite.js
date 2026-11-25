import BodySprite from './BodySprite.js'
import { bodyImage, wreckFor } from './wreckView.js'
import atlasFrame from './atlasFrame.js'

/**
 * The view of a body drawn from an atlas `art` of clips in rows (spriteArt.js): the drawn body, `art.body`, fills the
 * hit box and stands on the anchor at its bottom. A subclass picks `clip` and `clipTime` each frame. A destroyed
 * `flammable` body shows its wreck and burns.
 */
export default class AtlasSprite extends BodySprite {
  constructor(body, art, options) {
    super(body, art.src, options)
    this.art = art
    if (options.flammable) wreckFor(art.src)
    this.clip = 'idle'
    this.clipTime = 0
  }

  /** How many screen pixels one pixel of an atlas cell is. */
  get artScale() {
    const [left, top, right] = this.art.body
    return Math.min(this.width / (right - left), this.height / (this.art.anchor.y - top))
  }

  /** The frame of the clip at its time: a looping clip goes round, another holds its last frame. */
  get frame() {
    const clip = this.art.clips[this.clip]
    const count = clip.frameCount || this.art.columns
    const time = clip.loop ? this.clipTime % clip.seconds : this.clipTime
    return Math.min(count - 1, Math.floor(time / clip.seconds * count))
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    if (this.renderHit(ctx)) return
    const { art, artScale: scale } = this
    const { width, height } = art.frame
    const [left, , right] = art.body
    const image = bodyImage(this), wrecked = image !== this.image
    const damaged = image === this.damageArt?.image
    const sourceWidth = damaged ? this.damageArt.art.width : width
    const sourceHeight = damaged ? this.damageArt.art.height : height
    const [dx, dy] = damaged ? this.damageArt.art.offset ?? [0, 0] : [0, 0]
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, 1)
    ctx.imageSmoothingEnabled = false
    const source = wrecked ? [0, 0, sourceWidth, sourceHeight] : atlasFrame(width, height, this.frame, art.clips[this.clip].row, art.gutter)
    ctx.drawImage(image, ...source,
      (dx - (left + right) / 2) * scale, this.height / 2 + (dy - art.anchor.y) * scale, sourceWidth * scale, sourceHeight * scale)
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }

  renderHit(ctx) {
    const { art, artScale: scale } = this
    const [left, , right] = art.body
    return super.renderHit(ctx, { width: art.frame.width * scale, height: art.frame.height * scale,
      left: -(left + right) / 2 * scale, top: this.height / 2 - art.anchor.y * scale })
  }
}
