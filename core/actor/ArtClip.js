import GameObject2D from './GameObject2D.js'
import atlasFrame from './atlasFrame.js'

/** A separately loaded atlas, drawn by its owning view at a measured anchor; never an independent actor. */
export default class ArtClip extends GameObject2D {
  constructor(art) {
    super(art.src, { width: art.width, height: art.height, visible: false })
    this.art = art
  }

  sample(name, seconds, reverse = false) {
    const clip = this.art.clips[name]
    const duration = clip.ms.reduce((sum, ms) => sum + ms, 0)
    const elapsed = Math.max(0, seconds * 1000)
    const time = clip.loop ? elapsed % duration : Math.min(elapsed, duration)
    let end = 0, frame = clip.ms.length - 1
    for (let i = 0; i < clip.ms.length; i++) {
      end += clip.ms[i]
      if (time < end) {
        frame = i
        break
      }
    }
    const index = reverse ? clip.ms.length - 1 - frame : frame
    return { row: clip.row || 0, frame: clip.frameColumns?.[index] ?? index }
  }

  seconds(name) {
    return this.art.clips[name].ms.reduce((sum, ms) => sum + ms, 0) / 1000
  }

  draw(ctx, { name, time, x, y, scaleX, scaleY = scaleX, flip = 1, reverse = false }) {
    if (!this.image.naturalWidth) return false
    const { width, height, anchor, gutter = 0 } = this.art
    const { row, frame } = this.sample(name, time, reverse)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(flip, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, ...atlasFrame(width, height, frame, row, gutter),
      -anchor.x * scaleX, -anchor.y * scaleY, width * scaleX, height * scaleY)
    ctx.restore()
    return true
  }

  // The renderer visits children too; the owner alone decides which clip to draw.
  render() {}
}
