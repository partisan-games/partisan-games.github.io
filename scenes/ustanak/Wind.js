import Sound from '/core/io/audio/SoundSource.js'

export default class Wind {
  constructor({ random = Math.random } = {}) {
    this.random = random
    this.enabled = true
    this.windSound = new Sound('wind.mp3', { volume: .2, loop: true, profile: 'ambience' })
    this.sounds = [this.windSound]
    this.nextRound()
  }

  nextRound() {
    this.strength = (8 + this.random() * 8) * (this.random() < .5 ? -1 : 1)
  }

  get acceleration() {
    return this.enabled ? this.strength : 0
  }

  update() {
    this.windSound.volume = Math.abs(this.acceleration) / 16 * .3
    this.windSound.setPlaying(this.enabled)
  }

  get drift() {
    return this.acceleration * 1.5
  }
}
