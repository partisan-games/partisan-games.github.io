import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'
import vehicleArt from '/core/actor/vehicleArt.js'

// the settings of every tank, so the storybook gives this one their controls
export { tank } from './Tenk.js'

export default class TenkDesno extends Tenk {
  constructor({
    src = vehicleArt.germanTank.src,
    art = src === vehicleArt.germanTank.src ? vehicleArt.germanTank : null,
    cevSlika = 'armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png',
    x = randomInRange(canvas2d.width * 0.7, canvas2d.width) - 100,
    ...rest
  }) {
    super(src, { art, cevSlika, x, ...rest })
    this.angle = Math.PI
    this.flipX = this.flipY = -1
    this.cev.angle = Math.PI * 1.1
    this.cev.origin = 'DOLE_DESNO'
    this.cev.flipY = -1
  }

  get minX() {
    return canvas2d.width / 2
  }

  get maxX() {
    return canvas2d.width
  }

  diziCev(dt) {
    if (this.cev.angle <= Math.PI * 1.2) this.cev.angle += dt * .5
  }

  spustajCev(dt) {
    if (this.cev.angle >= Math.PI) this.cev.angle -= dt * .5
  }

  azurirajCev() {
    this.cev.x = this.x - this.width * .12
    this.cev.y = this.y - this.height * 0.35
  }
}
