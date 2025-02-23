import { ctx } from '/core/io/platno.js'
import Granata from '/core/actor/projektili/Granata.js'
import { randomInRange } from '/core/utils.js'

export default class Djule extends Granata {
  constructor({ r = 4, ...rest } = {}) {
    super({ src: null, ...rest })
    this.r = r
    this.sirina = this.visina = r * 2
    this.steta = randomInRange(20, 30)
  }

  render() {
    if (!this.vidljiv) return

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()
  }
}