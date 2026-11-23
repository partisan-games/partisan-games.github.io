import { assets } from '/config.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'
import imageReady from '/core/io/imageReady.js'

/**
 * The stages of the road to Trieste, in the order the column drives them: each a painted picture whose flat road
 * begins at `ground`, a share of its height, measured by its manifest
 * (assets/images/sources/pozadine/do-trsta/backgrounds.json).
 */
export const stages = [
  { id: 'lika', src: 'background/do-trsta-lika-1945.webp', ground: 840 / 1024 },
  { id: 'senj', src: 'background/do-trsta-senj-1945.webp', ground: 825 / 1024 },
  { id: 'rijeka', src: 'background/do-trsta-rijeka-1945.webp', ground: 836 / 1024 },
  { id: 'trst', src: 'background/do-trsta-trst-1945.webp', ground: 854 / 1024 },
]

/** How fast the landscape behind the road moves, as a share of the road's speed. */
const parallax = .3
/** Over how many pixels of road one stage fades into the next. */
const fade = 320

/**
 * The road to Trieste behind the fighting, the stages following each other over its `length` in pixels. A stage's
 * picture repeats, every other copy mirrored, so neighbours meet at the same pixels; its road moves with the view, the
 * landscape behind it slower. Over the last pixels of a stage the next one fades in. Scenery only.
 */
export default class Route {
  constructor({ groundY, distance, length }) {
    Object.assign(this, { groundY, distance })
    this.stageLength = length / stages.length
    this.images = stages.map(({ src }) => {
      const image = new Image()
      image.src = assets.images + src
      return image
    })
  }

  loaded() {
    return Promise.all(this.images.map(image => imageReady(image)))
  }

  /** The stage `distance` pixels along the road falls in. */
  stageAt(distance) {
    return stages[Math.min(stages.length - 1, Math.floor(distance / this.stageLength))]
  }

  render() {
    const distance = this.distance()
    const index = stages.indexOf(this.stageAt(distance))
    this.paint(index, distance)
    const left = (index + 1) * this.stageLength - distance
    if (index + 1 === stages.length || left >= fade) return
    ctx.save()
    ctx.globalAlpha = 1 - left / fade
    this.paint(index + 1, distance)
    ctx.restore()
  }

  /** A stage's picture with its road on the scene's ground line and as high as the screen below it. */
  paint(index, distance) {
    const image = this.images[index]
    if (!image.naturalWidth) return
    const { naturalWidth, naturalHeight } = image
    const horizon = naturalHeight * stages[index].ground
    const width = naturalWidth * this.groundY / horizon
    this.strip(image, 0, horizon, 0, this.groundY, width, distance * parallax)
    this.strip(image, horizon, naturalHeight - horizon, this.groundY, canvas2d.height - this.groundY, width, distance)
  }

  /** Rows `top` to `top + rows` of `image` across the screen from `y`, `height` high, in copies `width` wide, `shift` pixels on. */
  strip(image, top, rows, y, height, width, shift) {
    for (let x = -(shift % (2 * width)), copy = 0; x < canvas2d.width; x += width, copy++) {
      if (x + width < 0) continue
      if (copy % 2 === 0) {
        ctx.drawImage(image, 0, top, image.naturalWidth, rows, x, y, width, height)
        continue
      }
      ctx.save()
      ctx.translate(x + width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(image, 0, top, image.naturalWidth, rows, 0, y, width, height)
      ctx.restore()
    }
  }
}
