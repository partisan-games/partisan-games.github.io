/**
 * Fires when its cooldown allows: every barrel at once, as one accepted shot.
 * The caller makes the recoil (and the sound, unless the projectile carries it) only for an accepted shot.
 */
export default class Weapon {
  /**
   * `spawnProjectile(origin, direction)` puts one projectile in the world. Each barrel has
   * `angle` off the aimed direction in radians, and `x`, `y` off the origin; a game may change `barrels`.
   */
  constructor({ cooldown, spawnProjectile, barrels = [{ angle: 0 }] }) {
    this.cooldown = cooldown
    this.spawnProjectile = spawnProjectile
    this.barrels = barrels
  }

  /** Returns whether the shot was fired. */
  tryFire(origin, direction) {
    if (!this.cooldown.ready) return false

    this.barrels.forEach(({ angle = 0, x = 0, y = 0 }) =>
      this.spawnProjectile({ x: origin.x + x, y: origin.y + y }, direction + angle))
    this.cooldown.start()
    return true
  }
}
