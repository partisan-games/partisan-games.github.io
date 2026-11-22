import WorldPart from '/core/actor/WorldPart.js'

/** Empty trench scenery, placed by the scene independently of any soldier. */
export default class Trench extends WorldPart {
  constructor(options = {}) {
    super('armies/rov-prazan.gif', options)
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY * this.scaleX, this.flipX * this.scaleY)
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
