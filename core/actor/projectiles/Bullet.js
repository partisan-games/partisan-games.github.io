import Projectile from '/core/actor/projectiles/Projectile.js'
import Sound from '/core/io/audio/SoundSource.js'
import { outsideView } from '/core/actor/worldView.js'

/** Bullets keep the plane's own velocity, so they fly the same at every airspeed. */
export const inheritVelocity = shooter => ({ projectile }) => {
  projectile.dx += shooter.dx
  projectile.dy += shooter.dy
}

/** A bullet in world coordinates, heard as it leaves the gun; a machine gun's by default. */
export default class Bullet extends Projectile {
  /** The round the gun fires, also shown in the corner next to the rounds left. */
  static src = 'items/granata.gif'

  constructor(camera, { sound = 'aircraft-gun.mp3', damage } = {}) {
    super({ src: Bullet.src })
    this.camera = camera
    if (damage !== undefined) this.damage = damage
    this.sound = new Sound(sound, { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.sound)
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  launch(...args) {
    super.launch(...args)
    this.sound.play()
  }
}
