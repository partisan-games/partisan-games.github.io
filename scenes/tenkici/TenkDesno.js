import { keyboard } from '/core/io/Keyboard.js'
import { rightPlayerKeys as keys } from '/core/io/keys.js'
import platno from '/core/io/platno.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'

export default class TenkDesno extends Tenk {
  constructor({
    src = 'armies/game-ready/nemacki-tenk-bez-cevi.png',
    cevSlika = 'armies/game-ready/nemacki-tenk-cev.png',
    x = randomInRange(platno.width * 0.7, platno.width) - 100,
    ai = true,
    ...rest
  }) {
    super(src, { cevSlika, x, ...rest })
    this.ugao = Math.PI
    this.odrazX = this.odrazY = -1
    this.cev.ugao = Math.PI * 1.1
    this.cev.ishodiste = 'DOLE_DESNO'
    this.cev.odrazY = -1
    this.ai = ai
  }

  proveriGranice() {
    this.x = Math.min(Math.max(this.x, platno.width / 2), platno.width)
  }

  diziCev(dt) {
    if (this.cev.ugao <= Math.PI * 1.2) this.cev.ugao += dt * .5
  }

  spustajCev(dt) {
    if (this.cev.ugao >= Math.PI) this.cev.ugao -= dt * .5
  }

  handleInput(dt) {
    if (this.ai) return

    if (keyboard.isDown(keys.left) && this.x > platno.width / 2)
      this.dodajSilu(this.potisak, Math.PI)
    if (keyboard.isDown(keys.right) && this.x < platno.width)
      this.dodajSilu(this.potisak * 0.6, 0)
    if (keyboard.isDown(keys.up))
      this.diziCev(dt)
    if (keyboard.isDown(keys.down))
      this.spustajCev(dt)

    this.pokusajPucanje(keys.shoot)
  }

  azurirajCev() {
    this.cev.x = this.x - this.sirina * .12
    this.cev.y = this.y - this.visina * 0.35
  }
}