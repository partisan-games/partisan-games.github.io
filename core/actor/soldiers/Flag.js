import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'

export default class Flag extends Sprite {
  constructor({ x, y, italian = false, getTime }) {
    super(italian ? 'armies/talijani/vojnici/strelci/zastava.svg' : 'sprites/zastava.png', {
      names: ['wave'], frameCount: 1, x, y, width: 104, height: 65,
      defaultAnimation: 'wave', animationTime: .8,
    })
    this.italian = italian
    this.getTime = getTime
    this.way = italian ? -1 : 1
    this.settle = 0
  }

  drawFrame() {
    if (!this.animation) return
    ctx.imageSmoothingEnabled = false
    // One static cloth per side, deformed by the same presentation clock and wave.
    const sourceWidth = this.italian ? 121 : this.image.naturalWidth / 4
    const sourceX = this.italian ? 1 : 0
    const sourceY = this.italian ? 24 : 0
    const sourceHeight = this.italian ? 78 : this.image.naturalHeight
    const phase = (this.getTime?.() ?? this.animationElapsed) * 6
    ctx.save()
    ctx.scale(this.way, 1 - .9 * this.settle)
    const strips = 32
    for (let i = 0; i < strips; i++) {
      const u = i / strips
      const wave = Math.sin(phase - u * Math.PI * 2) * 5 * u * (1 - this.settle)
      ctx.drawImage(this.image, sourceX + sourceWidth * u, sourceY, sourceWidth / strips, sourceHeight,
        this.width * u, wave, this.width / strips + .2, this.height)
    }
    ctx.restore()
  }
}
