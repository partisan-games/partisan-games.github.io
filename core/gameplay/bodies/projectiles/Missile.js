import Bullet from './Bullet.js'

/** Seconds a missile flies before it is spent, and the damage of its burst, which destroys anything it hits. */
export const missile = { life: 5, damage: 1000 }

/**
 * A missile: a bullet that bursts where it hits a target or comes down to the ground that `groundAt(x, z)` gives.
 * `bursts` counts its bursts, so a view can show each one where the missile stopped.
 */
export default class Missile extends Bullet {
  constructor({ groundAt = () => 0, ...rest } = {}) {
    super({ life: missile.life, damage: { min: missile.damage, max: missile.damage }, ...rest })
    this.groundAt = groundAt
    this.bursts = 0
  }

  update(dt) {
    super.update(dt)
    if (this.state !== 'flight') return
    const ground = this.groundAt(this.x, this.z)
    if (this.y > ground) return
    this.y = ground
    this.bursts++
    this.setState('idle')
  }

  strike(hit) {
    super.strike(hit)
    this.bursts++
  }
}
