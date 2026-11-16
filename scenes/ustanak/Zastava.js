import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'

export default class Zastava extends Sprite {
  constructor({ x, y, italian = false }) {
    super(italian ? 'armies/talijani/vojnici/strelci/zastava.svg' : 'sprites/zastava.png', {
      names: ['vijori'], frameCount: italian ? 1 : 4, x, y, width: 104, height: 65,
      defaultAnimation: 'vijori', animationTime: .8,
    })
    this.italian = italian
  }

  drawFrame() {
    if (!this.animation) return
    ctx.imageSmoothingEnabled = false
    if (!this.italian) {
      const frame = Math.floor(this.animationElapsed % this.animationTime / this.animationTime * 4)
      const width = this.image.naturalWidth / 4
      ctx.drawImage(this.image, frame * width, 0, width, this.image.naturalHeight, 0, 0, this.width, this.height)
      return
    }
    // Keep the accepted emblem and opaque white stripe while the cloth bends around its fixed hoist.
    ctx.save()
    ctx.scale(-1, 1)
    const strips = 32
    for (let i = 0; i < strips; i++) {
      const u = i / strips
      const wave = Math.sin(this.animationElapsed * 6 - u * Math.PI * 2) * 5 * u
      ctx.drawImage(this.image, 1 + 121 * u, 24, 121 / strips, 78,
        this.width * u, wave, this.width / strips + .2, this.height)
    }
    ctx.restore()
  }
}
