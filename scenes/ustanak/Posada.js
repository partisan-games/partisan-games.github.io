import Predmet from '/core/actor/Predmet.js'
import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'

export default class Posada extends Predmet {
  constructor(x, y) {
    super('armies/partizani/artiljerija/posada-01.png', { x, y })
    this.pocetniX = x
    this.maxX = x + 10
  }

  handleInput(dt) {
    if (keyboard.isDown(keys.shoot))
      this.x = Math.min(this.x + 20 * dt, this.maxX)
    else
      this.x = this.pocetniX
  }

  update(dt, t) {
    this.x += Math.sin(t) * dt
  }
}