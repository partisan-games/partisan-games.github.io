import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A bomber's machine guns: within `range` metres they fire a round every `interval` seconds, at `bulletSpeed` for
 * `life` seconds, each taking `damage` off what it hits.
 */
export const gunTurrets = { range: 160, interval: .1, bulletSpeed: 220, life: 1.2, damage: { min: 8, max: 14 } }

/**
 * The machine guns of `plane`, which its crew aims at the nearest living one of `targets`, leading it by how far it
 * moves while a round flies there, or straight ahead with none in range; the turret nearest that aim fires, and only
 * while `firing`, which the player holds. Each of its `turrets`, from its plane's model, sits `ahead` of the plane's
 * place and `above` it by those shares of its length and height; without them it fires from the plane's place.
 * `clock` is the game clock.
 */
export default class GunTurrets {
  constructor({ plane, targets = [], clock, turrets = [{ ahead: 0, above: 0 }] }) {
    Object.assign(this, { plane, targets, turrets })
    this.firing = false
    this.shotsFired = 0
    this.reload = new Cooldown({ seconds: gunTurrets.interval, clock })
    this.rounds = new ProjectilePool(() => new Bullet({ life: gunTurrets.life, damage: gunTurrets.damage }))
  }

  /** The guns sit in the plane. */
  get x() {
    return this.plane.x
  }

  get y() {
    return this.plane.y
  }

  get z() {
    return this.plane.z
  }

  /** The nearest living target within range, or null. */
  get target() {
    const { plane } = this
    let nearest = null, nearestDistance = gunTurrets.range
    for (const target of this.targets) {
      const distance = Math.hypot(target.x - plane.x, target.y - plane.y, target.z - plane.z)
      if (target.alive && distance < nearestDistance) [nearest, nearestDistance] = [target, distance]
    }
    return nearest
  }

  /** Where to aim to meet `target`: where it will be when a round gets there. */
  lead(target) {
    const { plane } = this
    let point = target
    for (let i = 0; i < 3; i++) {
      const time = Math.hypot(point.x - plane.x, point.y - plane.y, point.z - plane.z) / gunTurrets.bulletSpeed
      point = { x: target.x + target.vx * time, y: target.y + target.vy * time, z: target.z + target.vz * time }
    }
    return point
  }

  /** Where the turret nearest `point` sits now. */
  turretToward(point) {
    const { plane } = this
    const places = this.turrets.map(({ ahead, above }) => plane.ahead(ahead * plane.size.length, above * plane.size.height))
    const away = place => Math.hypot(point.x - place.x, point.y - place.y, point.z - place.z)
    return places.reduce((nearest, place) => away(place) < away(nearest) ? place : nearest)
  }

  update(dt) {
    const { plane, target } = this
    if (this.firing && plane.alive && this.reload.ready) {
      const point = target ? this.lead(target) : plane.ahead(gunTurrets.range)
      const turret = this.turretToward(point)
      const way = { x: point.x - turret.x, y: point.y - turret.y, z: point.z - turret.z }
      this.rounds.fire(turret,
        Math.atan2(-way.z, way.x), Math.atan2(way.y, Math.hypot(way.x, way.z)), gunTurrets.bulletSpeed)
      this.shotsFired++
      this.reload.start()
    }
    this.rounds.update(dt, this.targets)
  }

  end() {}
}
