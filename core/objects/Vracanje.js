import Predmet from '/core/actor/Predmet.js'
import platno from '/core/io/platno.js'

export default class Vracanje extends Predmet {
  constructor({ src, tlo, procenat = .25, x = Math.random() * platno.width + platno.width, callback, ...rest } = {}) {
    super(src, { x, ...rest })
    this.wrapElapsed = 0
    this.procenat = procenat
    this.callback = callback
    if (tlo) this.onload = () => this.tlo(tlo)
  }

  reset() {
    this.alive = true
  }

  umri() {
    if (this.callback) this.callback()
    this.alive = false
  }

  proveriGranice() {
    if (this.wrapElapsed < 1) return

    if (Math.random() > 1 - this.procenat) this.vracaVodoravno(() => this.reset())

    this.wrapElapsed = 0
  }

  update(dt) {
    this.wrapElapsed += dt
    super.update(dt)
  }
}
