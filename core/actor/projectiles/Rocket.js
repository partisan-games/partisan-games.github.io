import Projectile from './Projectile.js'
import Sound from '/core/io/audio/SoundSource.js'

/** A rocket owns its sustained motor; the impact stays at its contact point. */
export default class Rocket extends Projectile {
  constructor(options) {
    super(options)
    this.motorSound = new Sound('rocket-thrust.mp3', { volume: .25, loop: true, profile: 'flight', spatial: { getPosition: () => this.position } })
    this.impactSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.motorSound, this.impactSound)
  }

  launch(...args) {
    super.launch(...args)
    this.motorSound.setPlaying(true)
  }

  reset() {
    super.reset()
    this.motorSound?.stop()
  }

  hit(target, ...args) {
    this.impactSound.play()
    return super.hit(target, ...args)
  }
}
