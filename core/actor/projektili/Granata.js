import Predmet from '/core/actor/Predmet.js'
import { platno } from '/core/io/platno.js'
import Metak from './Metak.js'

const duzinaEksplozije = 150

const blizuTla = () => platno.height - Math.random() * platno.height * 0.2

export default class Granata extends Metak {
  constructor({ skalar = .5, nivoTla = blizuTla(), gravitacija = 98, ...rest } = {}) {
    super({ skalar, ...rest })
    this.nivoTla = nivoTla
    this.gravitacija = gravitacija
    this.timerId = null
    this.plamicak = new Predmet('plamen.gif', { skalar: 0.4 })
    this.predmeti.push(this.plamicak)
    this.reset()
  }

  reset() {
    super.reset()
    clearTimeout(this.timerId)
    this.timerId = null
    this.plamicak?.sakrij()
  }

  proveriGranice() {
    if (this.vanEkrana || this.y > this.nivoTla) this.reset()
  }

  /* SUDAR */

  proveriPogodak(cilj) {
    if (!cilj.sudara(this)) return

    this.eksplodiraj()

    if (!this.timerId)
      this.timerId = setTimeout(() => this.povredi(cilj), duzinaEksplozije)
  }

  eksplodiraj() {
    this.plamicak.polozaj = this.polozaj
    this.plamicak.pokazi()
  }
}
