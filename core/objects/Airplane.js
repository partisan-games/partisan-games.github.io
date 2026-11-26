import { randomInRange } from '/core/utils.js'
import canvas2d from '/core/io/canvas2d.js'
import Recurring from './Recurring.js'
import Sound from '/core/io/audio/SoundSource.js'

const randomHeight = () => randomInRange(canvas2d.height * .2, canvas2d.height * .4)

export const italianAirplanePictures = {
  fiat: 'game-ready/avioni/fiat-cr42.webp',
  imam: 'game-ready/avioni/imam-ro57.webp',
}
const doubledPictures = new Set(Object.values(italianAirplanePictures))

export default class Airplane extends Recurring {
  constructor({ src = italianAirplanePictures.fiat, y = randomHeight(), flammable = true, speed = -240, scale = 1, ...rest } = {}) {
    // The Italian redraws carry twice the source resolution at the same display scale.
    super({ src, y, speed, flammable, scale: doubledPictures.has(src) ? scale / 2 : scale, ...rest })
    this.counter = 0
    this.engineSound = new Sound('avion-mali.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position, getRevision: () => this.audioRevision ?? 0 } })
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
    this.engineSound.setPlaying(Boolean(this.alive && this.visible))
  }
}
