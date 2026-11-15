import Metak from '/core/actor/projektili/Metak.js'
import platno, { ctx } from '/core/io/platno.js'

/** Projectile simulation uses world coordinates; visibility uses the current camera. */
export default class BoatBullet extends Metak {
  constructor(viewLeft) {
    super({ src: null, sirina: 10, visina: 2, z: -1 })
    this.viewLeft = viewLeft
    this.steta = 10
  }

  reset() {
    super.reset()
    this.start = this.end = null
  }

  get vanEkrana() {
    const x = this.x - this.viewLeft()
    return x < -this.sirina || x > platno.width + this.sirina ||
      this.y < -this.sirina || this.y > platno.height + this.sirina
  }

  update(dt) {
    if (!this.vidljiv) return
    if (this.vanEkrana) { this.reset(); return }
    this.start = { x: this.x, y: this.y }
    this.azurirajKretanje(dt)
    this.end = { x: this.x, y: this.y }
    // Hit resolution precedes retirement, even if this segment leaves the screen.
  }

  render() {
    if (!this.prikazan) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.ugao)
    ctx.fillStyle = '#ffe2a0'
    ctx.fillRect(-this.sirina / 2, -this.visina / 2, this.sirina, this.visina)
    ctx.restore()
  }
}
