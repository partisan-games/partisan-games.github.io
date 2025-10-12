import { keyboard } from '/core/io/Keyboard.js'
import platno from '/core/io/platno.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'

export default class TenkLevo extends Tenk {
  constructor({
    src = 'armies/game-ready/partizanski-tenk-bez-cevi.png',
    cevSlika = 'armies/game-ready/partizanski-tenk-cev.png',
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
    if (keyboard.pressed.KeyA && this.x > 0)
      this.dodajSilu(this.potisak * 0.6, Math.PI)
    if (keyboard.pressed.KeyD && this.x < this.xLimit)
      this.dodajSilu(this.potisak, 0)
    if (keyboard.pressed.KeyW)
      this.diziCev(dt)
    if (keyboard.pressed.KeyS)
      this.spustajCev(dt)

    this.pokusajPucanje('Space')
  }

  azurirajCev() {
    this.cev.x = this.x + this.sirina * .07
    this.cev.y = this.y - this.visina * 0.33
  }
}