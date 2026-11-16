import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'
import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'

export default class TenkLevo extends Tenk {
  constructor({
    src = 'armies/game-ready/tenkovi/partizanski-tenk-bez-cevi-pixel.png',
    cevSlika = 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png',
    x = randomInRange(0, canvas2d.width * 0.3),
    xLimit = canvas2d.width / 2,
    ...rest
  } = {}) {
    super(src, { cevSlika, x, ...rest })
    this.cev.angle = Math.PI * 1.9
    this.cev.origin = 'GORE_LEVO'
    this.xLimit = xLimit
  }

  checkBounds() {
    this.x = Math.min(Math.max(this.x, 0), this.xLimit)
  }

  diziCev(dt) {
    if (this.cev.angle <= Math.PI || this.cev.angle >= Math.PI * 1.8)
      this.cev.angle -= dt * .5
  }

  spustajCev(dt) {
    if (this.cev.angle >= Math.PI) this.cev.angle += dt * .5
  }

  handleInput(dt) {
    if (keyboard.isDown(keys.left) && this.x > 0)
      this.vozi(this.thrust * 0.6, Math.PI, dt)
    if (keyboard.isDown(keys.right) && this.x < this.xLimit)
      this.vozi(this.thrust, 0, dt)
    if (keyboard.isDown(keys.up))
      this.diziCev(dt)
    if (keyboard.isDown(keys.down))
      this.spustajCev(dt)

    this.pokusajPucanje(keys.shoot)
  }

  azurirajCev() {
    this.cev.x = this.x + this.width * .07
    this.cev.y = this.y - this.height * 0.33
  }
}
