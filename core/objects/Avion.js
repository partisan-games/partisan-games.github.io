import { randomInRange } from '/core/utils.js'
import platno from '/core/io/platno.js'
import Vracanje from './Vracanje.js'

const randomHeight = () => randomInRange(platno.height * .2, platno.height * .4)

export default class Avion extends Vracanje {
  constructor({ src = 'armies/talijani/avioni/fiat-cr42.png', y = randomHeight(), zapaljiv = true, brzina = -240, ...rest } = {}) {
    super({ src, y, brzina, zapaljiv, ...rest })
    this.brojac = 0
  }

  reset() {
    super.reset()
    this.y = randomHeight()
  }

  letiGoreDole(dt) {
    this.y += Math.sin(this.brojac) * 50 * dt
    this.brojac += dt
  }

  pada(dt) {
    this.y += dt * 100
  }

  update(dt) {
    if (this.ziv)
      this.letiGoreDole(dt)
    else
      this.pada(dt)

    super.update(dt)
  }
}