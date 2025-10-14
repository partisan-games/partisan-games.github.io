import { randomInRange } from '/core/utils.js'
import platno from '/core/io/platno.js'
import Vracanje from './Vracanje.js'

const randomHeight = () => randomInRange(platno.height * .2, platno.height * .4)

export default class Avion extends Vracanje {
  constructor({ src = 'armies/talijani/avioni/fiat-cr42.png', y = randomHeight(), zapaljiv = true, brzina = -240, ...rest } = {}) {
    super({ src, y, brzina, zapaljiv, ...rest })
  }

  reset() {
    super.reset()
    this.y = randomHeight()
  }

  update(dt) {
    if (!this.ziv)
      this.y += dt * 100
    super.update(dt)
  }
}