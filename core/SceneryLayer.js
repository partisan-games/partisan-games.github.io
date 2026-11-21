import { assets } from '/config.js'
import imageReady from './io/imageReady.js'
import sceneryArt from './sceneryArt.js'

/** Independent still props in the background image's native pixels; no actors, collisions or input. */
export default class SceneryLayer {
  constructor(items = [], { catalog = sceneryArt, createImage = src => Object.assign(new Image(), { src }) } = {}) {
    this.catalog = catalog
    this.createImage = createImage
    this.images = new Map()
    this.loads = new Map()
    this.setItems(items)
  }

  setItems(items) {
    for (const item of items) {
      const art = this.catalog[item.id]
      if (!art) throw new RangeError(`Unknown scenery prop: ${item.id}`)
      if (![item.x, item.y, item.scale ?? 1].every(Number.isFinite) || (item.scale ?? 1) <= 0)
        throw new RangeError(`Invalid scenery placement: ${item.id}`)
    }
    this.items = items
    for (const item of items) {
      const { src } = this.catalog[item.id]
      if (this.images.has(src)) continue
      const image = this.createImage(`${assets.images}${src}`)
      this.images.set(src, image)
      this.loads.set(src, imageReady(image))
    }
    this.ready = Promise.all(items.map(item => this.loads.get(this.catalog[item.id].src)))
    // Callers own loading errors, including resources that fail before they await ready.
    this.ready.catch(() => {})
    return this.ready
  }

  get orderedItems() {
    const layer = item => item.layer ?? this.catalog[item.id].layer
    return [...this.items].sort((a, b) => layer(a) - layer(b) || a.y - b.y)
  }

  render(ctx) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    for (const item of this.orderedItems) {
      const art = this.catalog[item.id], image = this.images.get(art.src)
      if (!image?.complete || !image.naturalWidth) continue
      ctx.save()
      ctx.translate(item.x, item.y)
      const scale = item.scale ?? 1
      ctx.scale(item.flip ? -scale : scale, scale)
      ctx.drawImage(image, -art.anchor.x, -art.anchor.y, art.width, art.height)
      ctx.restore()
    }
    ctx.restore()
  }
}
