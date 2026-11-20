import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import Tenk from './Tenk.js'
import vehicleArt from '/core/actor/vehicleArt.js'

// the settings of every tank, so the storybook gives this one their controls
export { tank } from './Tenk.js'

export default class TenkLevo extends Tenk {
  constructor({
    src = vehicleArt.partisanTank.src,
    art = src === vehicleArt.partisanTank.src ? vehicleArt.partisanTank : null,
    cevSlika = 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png',
    x = randomInRange(0, canvas2d.width * 0.3),
    xLimit = canvas2d.width / 2,
    ...rest
  } = {}) {
    super(src, { art, cevSlika, x, ...rest })
    this.cev.angle = Math.PI * 1.9
    this.cev.origin = 'GORE_LEVO'
    this.xLimit = xLimit
  }

  get minX() {
    return 0
  }

  get maxX() {
    return this.xLimit
  }

  diziCev(dt) {
    if (this.cev.angle <= Math.PI || this.cev.angle >= Math.PI * 1.8)
      this.cev.angle -= dt * .5
  }

  spustajCev(dt) {
    if (this.cev.angle >= Math.PI) this.cev.angle += dt * .5
  }

  azurirajCev() {
    this.cev.x = this.x + this.width * .07
    this.cev.y = this.y - this.height * 0.33
  }
}
