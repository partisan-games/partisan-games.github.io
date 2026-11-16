import { randomInRange } from '/core/utils.js'
import Pokretno from './Pokretno.js'

export default class Cloud2D extends Pokretno {
  constructor(thrust) {
    super('nature/oblak.gif', { thrust, shadow: true })
  }

  postaviBrzinu() {
    this.dy = randomInRange(this.thrust * .75, this.thrust * 1.25)
    this.dx = Math.random() * 10 - 5
  }
}
