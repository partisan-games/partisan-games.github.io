import WorldPart from '/core/actor/WorldPart.js'

/** The covers a soldier rises from, by kind; each picture is drawn at twice the size it shows. */
export const covers = { trench: 'rov-prazan', stones: 'gomila-kamenja' }
/** The size a cover shows in front of a soldier of the near row (scale 1), in pixels. */
const size = { width: 100, height: 150 }

/** The scenery in front of a soldier, a dug trench or a heap of stones, placed by the scene independently of him. */
export default class Cover extends WorldPart {
  constructor({ kind = 'trench', scale = 1, ...options } = {}) {
    super(`game-ready/polozaji/neretva/${covers[kind]}.webp`,
      { ...options, width: size.width * scale, height: size.height * scale })
    this.kind = kind
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
