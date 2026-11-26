import WorldPart from '/core/actor/WorldPart.js'

// Both pictures share a frame and firing window. The stone pile ends higher in the frame.
const covers = {
  trench: { file: 'rov-prazan', ground: .335 },
  stones: { file: 'gomila-kamenja', ground: .265 },
}
/** The size a cover shows in front of a soldier of the near row (scale 1), in pixels. */
const size = { width: 100, height: 150 }

/** The foreground lip of a trench or stone pile, placed independently of its soldier. */
export default class Cover extends WorldPart {
  constructor({ kind = 'trench', scale = 1, ...options } = {}) {
    super(`game-ready/polozaji/neretva/${covers[kind].file}.webp`,
      { ...options, width: size.width * scale, height: size.height * scale })
    this.kind = kind
  }

  get groundY() {
    return this.y + this.height * covers[this.kind].ground
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
