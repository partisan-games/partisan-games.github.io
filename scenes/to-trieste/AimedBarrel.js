import Predmet from '/core/actor/Predmet.js'
import { ctx } from '/core/io/platno.js'

/** A separate left-facing tube; its right end is the pivot, its left end the muzzle. */
export default class AimedBarrel extends Predmet {
  constructor({ owner, anchor, sourceRect, ...art }) {
    super(art.src, art)
    this.owner = owner
    this.anchor = anchor
    this.sourceRect = sourceRect
    this.reset()
  }

  reset() {
    this.ugao = Math.PI
    this.sync()
  }

  sync() {
    this.x = this.owner.x + this.owner.sirina * this.anchor.x
    this.y = this.owner.y + this.owner.visina * this.anchor.y
    this.polozaj.z = this.owner.polozaj.z
  }

  get muzzle() {
    return { x: this.x + Math.cos(this.ugao) * this.sirina, y: this.y + Math.sin(this.ugao) * this.sirina }
  }

  aimAt(target, aim) {
    this.sync()
    if (![this.x, this.y].every(Number.isFinite) || Math.hypot(target.x - this.x, target.y - this.y) <= this.sirina + 1) return null
    let angle = aim(this, target)
    // Solve from the tip, since rotating the tube also changes the launch position.
    for (let i = 0; i < 12 && angle !== null; i++) {
      const origin = { x: this.x + Math.cos(angle) * this.sirina, y: this.y + Math.sin(angle) * this.sirina }
      const next = aim(origin, target)
      if (next === null) return null
      if (Math.abs(Math.atan2(Math.sin(next - angle), Math.cos(next - angle))) < 1e-7) {
        this.ugao = angle
        return { origin: this.muzzle, angle: this.ugao }
      }
      angle = next
    }
    return null
  }

  render() {
    if (!this.owner.prikazan || !this.vidljiv || !this.slika?.naturalWidth || !Number.isFinite(this.x + this.y)) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.ugao - Math.PI)
    ctx.drawImage(this.slika, ...this.sourceRect, -this.sirina, -this.visina / 2, this.sirina, this.visina)
    ctx.restore()
  }
}
