import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A bomber's machine guns: within `range` metres they fire a round every `interval` seconds, at `bulletSpeed` for
 * `life` seconds, each taking `damage` off what it hits; the crew swings them `traverse` radians a second.
 */
export const gunTurrets = { range: 160, interval: .1, bulletSpeed: 220, life: 1.2, damage: { min: 8, max: 14 }, traverse: .9 }

const unit = ({ x, y, z }) => {
  const length = Math.hypot(x, y, z)
  return { x: x / length, y: y / length, z: z / length }
}

/** The unit direction `from` turned toward the unit direction `to`, by at most `angle` radians. */
function turnToward(from, to, angle) {
  const between = Math.acos(Math.max(-1, Math.min(1, from.x * to.x + from.y * to.y + from.z * to.z)))
  if (between <= angle) return to
  // straight behind, any way round will do: first turn across
  if (Math.sin(between) < 1e-6) return turnToward(from, unit({ x: -from.z, y: 0, z: from.x }), angle)
  const sin = Math.sin(between), keep = Math.sin(between - angle) / sin, take = Math.sin(angle) / sin
  return unit({ x: from.x * keep + to.x * take, y: from.y * keep + to.y * take, z: from.z * keep + to.z * take })
}

/**
 * The machine guns of `plane`, which its crew aims at the nearest living one of `targets`, leading it by how far it
 * moves while a round flies there, or straight ahead with none in range; the guns swing toward that aim, which they start
 * on straight ahead, and the turret nearest where they point fires, and only
 * while `firing`, which the player holds. Each of its `turrets`, from its plane's model, sits `ahead` of the plane's
 * place and `above` it by those shares of its length and height; without them it fires from the plane's place.
 * `clock` is the game clock.
 */
export default class GunTurrets {
  constructor({ plane, targets = [], clock, turrets = [{ ahead: 0, above: 0 }] }) {
    Object.assign(this, { plane, targets, turrets })
    this.firing = false
    /** The unit direction the guns point, from the plane. */
    this.aim = unit(this.way(plane.ahead(1)))
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

  /** The way from the plane to `point`. */
  way(point) {
    const { plane } = this
    return { x: point.x - plane.x, y: point.y - plane.y, z: point.z - plane.z }
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
    const way = this.way(target ? this.lead(target) : plane.ahead(gunTurrets.range))
    this.aim = turnToward(this.aim, unit(way), gunTurrets.traverse * dt)
    if (this.firing && plane.alive && this.reload.ready) {
      const distance = Math.hypot(way.x, way.y, way.z)
      const point = { x: plane.x + this.aim.x * distance, y: plane.y + this.aim.y * distance, z: plane.z + this.aim.z * distance }
      const turret = this.turretToward(point)
      const line = { x: point.x - turret.x, y: point.y - turret.y, z: point.z - turret.z }
      this.rounds.fire(turret,
        Math.atan2(-line.z, line.x), Math.atan2(line.y, Math.hypot(line.x, line.z)), gunTurrets.bulletSpeed)
      this.shotsFired++
      this.reload.start()
    }
    this.rounds.update(dt, this.targets)
  }

  end() {}
}
