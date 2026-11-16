import { keyboard } from '/core/io/Keyboard.js'
import { rightPlayerKeys as keys } from '/core/io/keys.js'
import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'

export default class TenkDesno extends Tenk {
  constructor({
    src = 'armies/game-ready/tenkovi/nemacki-tenk-bez-cevi-pixel.png',
    cevSlika = 'armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png',
    x = randomInRange(canvas2d.width * 0.7, canvas2d.width) - 100,
    ai = true,
    ...rest
  }) {
    super(src, { cevSlika, x, ...rest })
    this.angle = Math.PI
    this.flipX = this.flipY = -1
    this.cev.angle = Math.PI * 1.1
    this.cev.origin = 'DOLE_DESNO'
    this.cev.flipY = -1
    this.ai = ai
  }

  checkBounds() {
    this.x = Math.min(Math.max(this.x, canvas2d.width / 2), canvas2d.width)
  }

  diziCev(dt) {
    if (this.cev.angle <= Math.PI * 1.2) this.cev.angle += dt * .5
  }

  spustajCev(dt) {
    if (this.cev.angle >= Math.PI) this.cev.angle -= dt * .5
  }

  handleInput(dt) {
    if (this.ai) return

    if (keyboard.isDown(keys.left) && this.x > canvas2d.width / 2)
      this.vozi(this.thrust, Math.PI, dt)
    if (keyboard.isDown(keys.right) && this.x < canvas2d.width)
      this.vozi(this.thrust * 0.6, 0, dt)
    if (keyboard.isDown(keys.up))
      this.diziCev(dt)
    if (keyboard.isDown(keys.down))
      this.spustajCev(dt)

    this.pokusajPucanje(keys.shoot)
  }

  azurirajCev() {
    this.cev.x = this.x - this.width * .12
    this.cev.y = this.y - this.height * 0.35
  }
}
