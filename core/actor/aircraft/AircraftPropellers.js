import art from './propellerArt.js'
import { assets } from '/config.js'

/** Edge-on blade projections, in the same local coordinates and transform as the accepted plane image. */
export default class AircraftPropellers {
  constructor(src) {
    const key = src.replace(/^.*\/assets\/images\//, '')
    this.art = art[key]
    this.elapsed = 0
    if (!this.art) return
    this.image = new Image()
    this.image.src = assets.images + this.art.layer.src
  }

  update(dt, running = true) {
    if (this.art && running && dt > 0) this.elapsed = (this.elapsed + dt) % this.art.layer.seconds
  }

  get frameIndex() {
    return this.art ? Math.min(3, Math.floor(this.elapsed / this.art.layer.seconds * 4)) : 0
  }

  renderLocal(ctx, body) {
    if (!this.art || !this.image.complete || !this.image.naturalWidth || !Number.isFinite(body.width + body.height)) return
    const { bodySize, layer, hubs, projection } = this.art
    const sx = body.width / bodySize[0], sy = body.height / bodySize[1]
    const { width, height } = layer.frame
    for (const hub of hubs) {
      const scale = hub.span / (projection === 'side' ? height : width)
      const w = width * scale * sx, h = height * scale * sy
      ctx.drawImage(this.image, this.frameIndex * width, 0, width, height,
        (hub.x - bodySize[0] / 2) * sx - w / 2, (hub.y - bodySize[1] / 2) * sy - h / 2, w, h)
    }
  }
}
