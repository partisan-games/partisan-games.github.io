import ArtClip from './ArtClip.js'
import atlasFrame from './atlasFrame.js'

/** A view-owned flinch, registered to the original picture rather than its padded atlas cell. */
export default class HitReaction extends ArtClip {
  constructor(view, art) {
    super(art)
    this.view = view
    this.seen = view.body.hitsTaken
    this.elapsed = Infinity
  }

  update(dt) {
    const hits = this.view.body.hitsTaken
    this.elapsed = hits > this.seen ? 0 : this.elapsed + (dt ?? 0)
    this.seen = hits
  }

  draw(ctx, { x = 0, y = 0, width, height, left = -width / 2, top = -height / 2, angle = 0, flip = 1 }) {
    if (this.view.body.dead || this.elapsed >= this.seconds('hit') || !this.image.naturalWidth) return false
    const { referenceSize: [rw, rh], referenceBounds: r, bounds: b } = this.art
    const scale = (r[3] - r[1]) / (b[3] - b[1])
    const dx = (r[0] + r[2] - (b[0] + b[2]) * scale) / 2
    const dy = r[3] - b[3] * scale
    const { row, frame } = this.sample('hit', this.elapsed)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.scale(flip, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, ...atlasFrame(this.art.width, this.art.height, frame, row, this.art.gutter),
      left + dx * width / rw, top + dy * height / rh,
      this.art.width * scale * width / rw, this.art.height * scale * height / rh)
    ctx.restore()
    return true
  }
}
