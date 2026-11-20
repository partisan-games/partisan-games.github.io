import Projectile from '/core/actor/projectiles/Projectile.js'

/** An anti-aircraft shell in world coordinates. Its fuse bursts it where it was aimed; `onBurst(shell)` deals the damage. */
export default class FlakShell extends Projectile {
  constructor({ onBurst }) {
    super({ src: 'items/granata.gif', scale: .4 })
    this.onBurst = onBurst
    this.fuse = 0
  }

  /** A shell out of view still flies on to its burst. */
  get offScreen() {
    return false
  }

  fire(position, angle, speed, fuse) {
    this.launch(position, angle, speed)
    this.fuse = fuse
  }

  update(dt) {
    if (!this.visible) return
    super.update(dt)
    this.fuse -= dt
    if (this.fuse > 0) return
    this.reset()
    this.onBurst(this)
  }
}
