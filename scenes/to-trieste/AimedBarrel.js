import GameObject2D from '/core/actor/GameObject2D.js'
import { ctx } from '/core/io/canvas2d.js'

/** A separate left-facing tube; its right end is the pivot, its left end the muzzle. */
export default class AimedBarrel extends GameObject2D {
  constructor({ owner, anchor, sourceRect, ...art }) {
    super(art.src, art)
    this.owner = owner
    this.anchor = anchor
    this.sourceRect = sourceRect
    this.reset()
  }

  reset() {
    this.angle = Math.PI
    this.sync()
  }

  sync() {
    this.x = this.owner.x + this.owner.width * this.anchor.x
    this.y = this.owner.y + this.owner.height * this.anchor.y
    this.position.z = this.owner.position.z
  }

  get muzzle() {
    return { x: this.x + Math.cos(this.angle) * this.width, y: this.y + Math.sin(this.angle) * this.width }
  }

  aimAt(target, aim) {
    this.sync()
    if (![this.x, this.y].every(Number.isFinite) || Math.hypot(target.x - this.x, target.y - this.y) <= this.width + 1) return null
    let angle = aim(this, target)
    // Solve from the tip, since rotating the tube also changes the launch position.
    for (let i = 0; i < 12 && angle !== null; i++) {
      const origin = { x: this.x + Math.cos(angle) * this.width, y: this.y + Math.sin(angle) * this.width }
      const next = aim(origin, target)
      if (next === null) return null
      if (Math.abs(Math.atan2(Math.sin(next - angle), Math.cos(next - angle))) < 1e-7) {
        this.angle = angle
        return { origin: this.muzzle, angle: this.angle }
      }
      angle = next
    }
    return null
  }

  render() {
    if (!this.owner.shown || !this.visible || !this.image?.naturalWidth || !Number.isFinite(this.x + this.y)) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle - Math.PI)
    ctx.drawImage(this.image, ...this.sourceRect, -this.width, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
