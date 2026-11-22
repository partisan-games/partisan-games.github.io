import Building from './Building.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A tower's gun, measured from the earlier tower: it fires at a target within `range` metres every `interval` seconds,
 * rounds that fly at `speed` metres a second for `life` seconds and take `damage` off what they hit. An airfield tower
 * is the same gun, shorter-ranged and weaker.
 */
export const tower = { range: 200, interval: .5, damage: 100, speed: 100, life: 5 }
export const airfieldTower = { range: 50, interval: 1.5, damage: 10, speed: 100, life: 5 }

/**
 * A tower with a gun on its top, which fires at the nearest living one of `targets` within its range, at where it is
 * when the round leaves; out of range, its rounds in the air are spent. `clock` is the game clock.
 */
export default class Tower extends Building {
  constructor({ clock, targets = [], gun = tower, ...rest } = {}) {
    super({ kind: 'tower', ...rest })
    Object.assign(this, { targets, gun })
    this.reload = new Cooldown({ seconds: gun.interval, clock })
    this.rounds = new ProjectilePool(() => new Bullet({ life: gun.life, damage: { min: gun.damage, max: gun.damage } }))
  }

  get muzzle() {
    return { x: this.x, y: this.y + this.size.height / 2, z: this.z }
  }

  /** The nearest living target within range, or null. */
  get target() {
    const { muzzle } = this
    let nearest = null, nearestDistance = this.gun.range
    for (const target of this.targets) {
      const distance = Math.hypot(target.x - muzzle.x, target.y - muzzle.y, target.z - muzzle.z)
      if (target.alive && distance < nearestDistance) [nearest, nearestDistance] = [target, distance]
    }
    return nearest
  }

  update(dt) {
    super.update(dt)
    const { target, muzzle } = this
    if (!target) for (const round of this.rounds.projectiles) round.setState('idle')
    else if (this.alive && this.reload.ready) {
      const way = { x: target.x - muzzle.x, y: target.y - muzzle.y, z: target.z - muzzle.z }
      this.rounds.fire(muzzle, Math.atan2(-way.z, way.x), Math.atan2(way.y, Math.hypot(way.x, way.z)), this.gun.speed)
      this.shotsFired++
      this.reload.start()
    }
    this.rounds.update(dt, this.targets)
  }
}
