import canvas2d, { ctx } from '/core/io/canvas2d.js'
import Shell from '/core/actor/projectiles/Shell.js'
import { randomInRange } from '/core/utils.js'

export default class Djule extends Shell {
  constructor({ r = 4, ...rest } = {}) {
    super({ src: null, ...rest })
    this.r = r
    this.width = this.height = r * 2
    this.damage = randomInRange(20, 30)
  }

  get shown() {
    return this.visible
  }

  checkBounds() {
    if (this.timerId) return
    if (this.x + this.r < 0 || this.x - this.r > canvas2d.width) {
      this.reset()
      return
    }
    if (this.y + this.r >= this.groundLevel) {
      this.stop()
      this.explode()
      this.timerId = this.clock.after(.15, () => this.reset())
    }
  }

  render() {
    if (!this.visible) return

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()
  }
}
