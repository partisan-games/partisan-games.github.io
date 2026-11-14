import Predmet from '/core/actor/Predmet.js'
import { platno } from '/core/io/platno.js'
import Metak from './Metak.js'

const duzinaEksplozije = .15 // seconds

const blizuTla = () => platno.height - Math.random() * platno.height * 0.2

export default class Granata extends Metak {
  constructor({ clock, skalar = .5, nivoTla = blizuTla(), gravitacija = 98, ...rest } = {}) {
    super({ skalar, ...rest })
    this.clock = clock
    this.nivoTla = nivoTla
    this.gravitacija = gravitacija
    this.timerId = null
    this.plamicak = new Predmet('plamen.gif', { skalar: 0.4 })
    this.predmeti.push(this.plamicak)
    this.reset()
  }

  reset() {
    super.reset()
    if (this.timerId) this.clock.cancel(this.timerId) // Metak resets before the clock is set
    this.timerId = null
    this.plamicak?.sakrij()
  }

  proveriGranice() {
    if (this.timerId) return
    if (this.vanEkrana || this.y > this.nivoTla) this.reset()
  }

  /* SUDAR */

  proveriPogodak(cilj) {
    if (this.timerId || !cilj.sudara(this)) return

    this.stani()
    this.eksplodiraj()

    if (!this.timerId) {
      const lifeId = cilj.lifeId
      this.timerId = this.clock.after(duzinaEksplozije, () => {
        // A recycled target is a new life; the old hit must not follow it.
        if (lifeId !== undefined && (cilj.lifeId !== lifeId || cilj.dead)) {
          this.reset()
          return
        }
        this.povredi(cilj)
      })
    }
  }

  eksplodiraj() {
    this.plamicak.polozaj = this.polozaj
    this.plamicak.pokazi()
  }

  update(dt) {
    // Keep the confirmed impact still until its delayed damage resolves.
    if (this.timerId) return
    super.update(dt)
  }
}
