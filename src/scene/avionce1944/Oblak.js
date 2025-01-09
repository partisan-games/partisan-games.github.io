import Predmet from '/game-engine/core/Predmet.js'
import platno from '/game-engine/io/platno.js'
import { randomInRange } from '/game-engine/utils.js'

export default class Oblak extends Predmet {
  constructor(brzina) {
    super('/assets/slike/oblak.gif')
    this.brzina = brzina
    this.reset()
  }

  reset() {
    this.dy = randomInRange(this.brzina * .75, this.brzina * 1.25)
    this.dx = Math.random() * 10 - 5
    const noviX = Math.random() * platno.width
    this.polozaj(noviX, 50)
  }

  proveriGranice() {
    if (this.y > platno.height) this.reset()
  }
}
