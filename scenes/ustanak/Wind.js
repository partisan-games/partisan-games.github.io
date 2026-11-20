import Sound from '/core/io/audio/SoundSource.js'

/**
 * How strong the wind of a round is at least and at most, either way, in px per second squared on a shell; and by how
 * much that strength is multiplied for the speed, in px per second, at which it carries smoke and fire.
 */
export const wind = { min: 8, max: 16, drift: 1.5 }

export default class Wind {
  constructor({ random = Math.random } = {}) {
    this.random = random
    this.enabled = true
    this.windSound = new Sound('wind.mp3', { volume: .2, loop: true, profile: 'ambience' })
    this.sounds = [this.windSound]
    this.nextRound()
  }

  nextRound() {
    this.strength = (wind.min + this.random() * (wind.max - wind.min)) * (this.random() < .5 ? -1 : 1)
  }

  get acceleration() {
    return this.enabled ? this.strength : 0
  }

  update() {
    this.windSound.volume = Math.abs(this.acceleration) / wind.max * .3
    this.windSound.setPlaying(this.enabled)
  }

  get drift() {
    return this.acceleration * wind.drift
  }
}
