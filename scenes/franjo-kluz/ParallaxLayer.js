import { assets } from '/config.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'

/**
 * Scenery repeated across the screen and moving at `depth` of the camera's horizontal speed: 1 moves with the
 * ground, less lies farther away. Heights are world heights, so the scenery sinks as the plane climbs.
 * `drift` moves the layer by itself, in pixels per second, as wind moves clouds.
 */
export default class ParallaxLayer {
  constructor({ src, count, depth, z, camera, place, drift = 0 }) {
    this.depth = depth
    this.drift = drift
    this.camera = camera
    this.position = { z }
    this.sprites = Array.from({ length: count }, () => ({ x: Math.random() * canvas2d.width, y: 0 }))
    this.image = new Image()
    this.imageLoaded = new Promise(resolve => {
      this.image.onload = () => {
        this.sprites.forEach(sprite => {
          sprite.y = place(this.image.naturalHeight)
        })
        resolve(this.image)
      }
    })
    this.image.src = assets.images + src
  }

  update(dt) {
    for (const sprite of this.sprites) sprite.x += this.drift * dt
  }

  /** Drawn inside the camera's translation, so it adds the camera back to place each sprite on the screen. */
  render() {
    if (!this.image.naturalWidth) return
    const { naturalWidth: width, naturalHeight: height } = this.image
    const span = canvas2d.width + width
    const left = this.camera.cameraX
    for (const sprite of this.sprites) {
      const screenX = ((sprite.x - left * this.depth) % span + span) % span - width / 2
      ctx.drawImage(this.image, left + screenX - width / 2, sprite.y - height / 2, width, height)
    }
  }
}
