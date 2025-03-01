import Predmet from '/core/actor/Predmet.js'
import Vreme from '/core/Vreme.js'
import platno from '/core/io/platno.js'

export default class Vracanje extends Predmet {
  constructor({ src, tlo, procenat = .25, x = Math.random() * platno.width * 2, ...rest } = {}) {
    super(src, { x, ...rest })
    this.vreme = new Vreme()
    this.procenat = procenat
    if (tlo) this.onload = () => this.tlo(tlo)
  }

  reset() {
    this.ziv = true
  }

  umri() {
    this.ziv = false
  }

  proveriGranice() {
    if (this.vreme.proteklo < 1000) return

    if (Math.random() > 1 - this.procenat) this.vracaVodoravno(() => this.reset())

    this.vreme.reset()
  }
}
