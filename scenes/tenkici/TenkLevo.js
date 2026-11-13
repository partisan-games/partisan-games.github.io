import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'
import platno from '/core/io/platno.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'

export default class TenkLevo extends Tenk {
  constructor({
    src = 'armies/game-ready/partizanski-tenk-bez-cevi-pixel.png',
    cevSlika = 'armies/game-ready/partizanski-tenk-cev-pixel.png',
    x = randomInRange(0, platno.width * 0.3),
    xLimit = platno.width / 2,
    ...rest
  } = {}) {
    super(src, { cevSlika, x, ...rest })
    this.cev.ugao = Math.PI * 1.9
    this.cev.ishodiste = 'GORE_LEVO'
    this.xLimit = xLimit
  }

  proveriGranice() {
    this.x = Math.min(Math.max(this.x, 0), this.xLimit)
  }

  diziCev(dt) {
    if (this.cev.ugao <= Math.PI || this.cev.ugao >= Math.PI * 1.8)
      this.cev.ugao -= dt * .5
  }

  spustajCev(dt) {
    if (this.cev.ugao >= Math.PI) this.cev.ugao += dt * .5
  }

  handleInput(dt) {
    if (keyboard.isDown(keys.left) && this.x > 0)
      this.vozi(this.potisak * 0.6, Math.PI, dt)
    if (keyboard.isDown(keys.right) && this.x < this.xLimit)
      this.vozi(this.potisak, 0, dt)
    if (keyboard.isDown(keys.up))
      this.diziCev(dt)
    if (keyboard.isDown(keys.down))
      this.spustajCev(dt)

    this.pokusajPucanje(keys.shoot)
  }

  azurirajCev() {
    this.cev.x = this.x + this.sirina * .07
    this.cev.y = this.y - this.visina * 0.33
  }
}
