import Projectile from '/core/actor/projectiles/Projectile.js'
import Sound from '/core/io/audio/SoundSource.js'

/** A player bullet, heard as it leaves the gun. */
export default class Bullet extends Projectile {
  constructor(options) {
    super(options)
    this.sound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.sound)
  }

  launch(...args) {
    super.launch(...args)
    this.sound.play()
  }
}
