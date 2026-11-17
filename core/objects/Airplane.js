import { randomInRange } from '/core/utils.js'
import canvas2d from '/core/io/canvas2d.js'
import Recurring from './Recurring.js'
import Sound from '/core/io/ManagedSound.js'

const randomHeight = () => randomInRange(canvas2d.height * .2, canvas2d.height * .4)

export default class Airplane extends Recurring {
  constructor({ src = 'armies/talijani/avioni/fiat-cr42.png', y = randomHeight(), flammable = true, speed = -240, ...rest } = {}) {
    super({ src, y, speed, flammable, ...rest })
    this.counter = 0
    this.engineSound = new Sound('avion-mali.mp3', { volume: .2, loop: true })
    this.sounds.push(this.engineSound)
  }

  reset() {
    super.reset()
    this.y = randomHeight()
  }

  flyUpAndDown(dt) {
    this.y += Math.sin(this.counter) * 50 * dt
    this.counter += dt
  }

  fall(dt) {
    this.y += dt * 100
  }

  update(dt) {
    if (this.alive)
      this.flyUpAndDown(dt)
    else
      this.fall(dt)

    super.update(dt)
    this.engineSound.setPlaying(Boolean(this.alive && this.shown))
  }
}
