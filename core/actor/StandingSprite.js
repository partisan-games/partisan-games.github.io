import BodySprite from './BodySprite.js'

/**
 * The view of a body drawn from an atlas `art` with one clip a row, named in `art.names`, of `art.columns` frames,
 * at the size of the body, its feet on the body's bottom: `art.baseline` is where the feet are in the picture, as a
 * share of its height. A subclass picks `clip`, which plays `clipTime` seconds of `art.durations[clip]` and loops
 * when `loop` says so, holding its last frame otherwise.
 */
export default class StandingSprite extends BodySprite {
  constructor(body, art, options) {
    super(body, art.src, options)
    this.art = art
    this.clip = art.defaultAnimation
    this.clipTime = 0
    this.loop = true
  }

  get frame() {
    const { columns, durations } = this.art
    const seconds = durations[this.clip]
    const time = this.loop ? this.clipTime % seconds : this.clipTime
    return Math.min(columns - 1, Math.floor(time / seconds * columns))
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    if (this.renderHit(ctx)) return
    const { art } = this
    const width = this.image.naturalWidth / art.columns
    const height = this.image.naturalHeight / art.names.length
    const feet = this.y + this.height / 2
    ctx.save()
    ctx.translate(this.x, feet)
    ctx.scale(this.flipY, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, this.frame * width, art.names.indexOf(this.clip) * height, width, height,
      -this.width / 2, -this.height * art.baseline, this.width, this.height)
    ctx.restore()
  }

  renderHit(ctx) {
    return super.renderHit(ctx, { y: this.y + this.height / 2, top: -this.height * this.art.baseline, angle: 0 })
  }
}
