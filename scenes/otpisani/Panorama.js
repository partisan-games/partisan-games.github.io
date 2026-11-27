import { canvas2d, ctx } from '/core/io/canvas2d.js'
import { assets } from '/config.js'
import { panorama } from './streets.js'

/** A street's panorama as high as the screen, slid by `camera.cameraX`, the screen's pixels the camera has moved. */
export default class Panorama {
  constructor(src, camera) {
    this.camera = camera
    this.image = new Image()
    this.image.src = assets.images + src
  }

  /** Screen pixels to a pixel of the picture. */
  get scale() {
    return canvas2d.height / panorama.height
  }

  /** How far the camera can slide before the picture's right edge reaches the screen's. */
  get length() {
    return Math.max(0, panorama.width * this.scale - canvas2d.width)
  }

  render() {
    if (!this.image.naturalWidth) return
    ctx.drawImage(this.image, -this.camera.cameraX, 0, panorama.width * this.scale, canvas2d.height)
  }
}
