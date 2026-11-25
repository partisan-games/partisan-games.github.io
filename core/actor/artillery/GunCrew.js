import art from './crewArt.js'
import { assets } from '/config.js'

/** The crew stands behind the real gun, works only on a shot, and settles once when it is destroyed. */
export default class GunCrew {
  constructor(kind) {
    this.art = art[kind]
    this.image = new Image()
    this.image.src = assets.images + this.art.src
    this.name = 'idle'
    this.elapsed = 0
  }

  fire() {
    if (this.name === 'death') return
    this.name = 'fire'
    this.elapsed = 0
  }

  update(dt, dead) {
    if (dead && this.name !== 'death') {
      this.name = 'death'
      this.elapsed = 0
    } else if (!dead && this.name === 'death') {
      this.name = 'idle'
      this.elapsed = 0
    }
    const seconds = this.name === 'death' ? this.art.deathSeconds : this.art.fireSeconds
    this.elapsed = Math.min(seconds, this.elapsed + dt)
    if (this.name === 'fire' && this.elapsed >= seconds) this.name = 'idle'
  }

  get frameIndex() {
    if (this.name === 'idle') return 0
    const seconds = this.name === 'death' ? this.art.deathSeconds : this.art.fireSeconds
    return Math.min(3, Math.floor(this.elapsed / seconds * 4))
  }

  renderLocal(ctx, body) {
    if (!this.image.complete || !this.image.naturalWidth || !Number.isFinite(body.width + body.height)) return
    const { frame, bodySize, bodyOffset } = this.art
    const scale = body.width / bodySize[0]
    ctx.drawImage(this.image, this.frameIndex * frame.width, this.name === 'death' ? frame.height : 0,
      frame.width, frame.height, -body.width / 2 - bodyOffset[0] * scale,
      -body.height / 2 - bodyOffset[1] * scale, frame.width * scale, frame.height * scale)
  }
}
