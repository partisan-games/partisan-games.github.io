import Projectile from '/core/actor/projectiles/Projectile.js'
import { createSound, randomVolume } from '/core/io/sound.js'

/** A player bullet, heard as it leaves the gun. */
export default class Bullet extends Projectile {
  constructor(options) {
    super(options)
    this.sound = createSound('pucanj.wav')
  }

  launch(...args) {
    super.launch(...args)
    this.sound.currentTime = 0 // a reused bullet starts its shot over
    this.sound.volume = randomVolume()
    this.sound.play()
  }
}
