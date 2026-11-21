import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { hullEntry } from '../projectiles/hits.js'

/**
 * A small motor boat seen from above, measured from the earlier pixel boat at 25 px a metre and 30 frames a second:
 * the push of its engine in metres a second squared, the share of its speed kept each second, how fast it turns, in
 * radians a second, and the push of the river's current; seconds between shots, the bullet speed, how far it aims,
 * in metres, and the damage of a round.
 */
export const boat = {
  thrust: 60, keep: .85 ** 30, turn: 1.41, current: 7.2, reload: .18, bulletSpeed: 28, reach: 42, damage: 10,
  health: 100,
}

/** The boat sails as it is steered; set to fire, it also fires as often as it reloads; or it is lost. */
const states = {
  idle: {},
  fire: { update: body => body.shoot() },
  dead: {},
}

/**
 * A motor boat with a machine gun in its bow, seen from above, heading along `yaw` (0 down the river, to the right).
 * The river's current pushes it back, but never past `startX`; the banks, `bounds.minZ` and `bounds.maxZ`, turn it back
 * into the stream. Its rounds hit the living ones of `targets`. `clock` is the game clock, and it fires only while
 * `canFire()`.
 */
export default class Boat extends Body {
  constructor({ startX = -Infinity, bounds = { minZ: -Infinity, maxZ: Infinity }, clock, targets = [],
    canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: { length: 7.1, height: .6, width: 3.04 }, health: boat.health, ...rest, states })
    Object.assign(this, { startX, bounds, targets, canFire })
    this.reload = new Cooldown({ seconds: boat.reload, clock })
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: boat.damage, max: boat.damage }, random }))
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** The way it heads, in x and z. */
  get heading() {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) }
  }

  get muzzle() {
    const { x, z } = this.heading, half = this.size.length / 2
    return { x: this.x + x * half, y: this.y, z: this.z + z * half }
  }

  get shots() {
    return { straight: { x: 12, y: 0 } }
  }

  get reach() {
    return boat.reach
  }

  /** Its gun is fixed in the bow, so it can fire only straight ahead. */
  aimAt(point) {
    return Math.sign(point.x - this.x) === this.forward
  }

  /** Turns right (1) or left (-1), as seen from above. */
  turn(way, dt) {
    if (this.alive) this.yaw -= way * boat.turn * dt
  }

  /** Full ahead along its heading. */
  throttle(dt) {
    if (this.dead) return
    const { x, z } = this.heading
    this.vx += x * boat.thrust * dt
    this.vz += z * boat.thrust * dt
  }

  /** Fires from the bow along its heading if it has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.reload.ready) return false
    this.bullets.fire(this.muzzle, this.yaw, 0, boat.bulletSpeed)
    this.shotsFired++
    this.reload.start()
    return true
  }

  hitTime(start, end) {
    return hullEntry({ start, end }, this)
  }

  /** The current pushes it back up the river, but not past where it set out; the banks turn it back. */
  keepInRiver(dt) {
    if (this.x > this.startX || this.vx > 0) this.vx -= boat.current * dt
    if (this.x <= this.startX) {
      this.x = this.startX
      if (this.vx < 0) this.vx = 0
    }
    const { minZ, maxZ } = this.bounds
    if ((this.z < minZ && this.heading.z < 0) || (this.z > maxZ && this.heading.z > 0)) {
      this.yaw = -this.yaw
      const { x, z } = this.heading
      this.vx += x * .2
      this.vz += z * .2
    }
  }

  update(dt) {
    super.update(dt)
    if (this.alive) {
      const keep = boat.keep ** dt
      this.vx *= keep
      this.vz *= keep
      this.keepInRiver(dt)
    } else this.vx = this.vz = 0
    this.bullets.update(dt, this.targets)
  }
}
