import Predmet from '/core/actor/Predmet.js'
import platno from '/core/io/platno.js'

export default class Planina extends Predmet {

  constructor({ nivoTla = platno.height, x = Math.random() * platno.width, dx = 0, ...rest } = {}) {
    super ('nature/planine.png', { x, ...rest })
    this.dx = dx
    this.onload = () => this.tlo(nivoTla + this.visina * .05)
  }

  proveriGranice() {
    this.kruzi()
  }
}
