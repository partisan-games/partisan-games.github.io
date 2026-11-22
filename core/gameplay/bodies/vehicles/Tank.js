import Body from '../Body.js'
import { earthGravity } from '../../gravity.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'

/**
 * Measured from the earlier pixel tank at 25 px a metre and 30 frames a second. `thrust` is metres a second squared
 * at full drive, `reverse` its share driving back, `recoil` the push of a shot or a hit in metres a second; `keep` is
 * the share of speed kept each second, moving and almost standing, below `standingBelow` metres a second; it burns at
 * `burnBelow` of its health or less, whatever its health is. The barrel
 * turns `barrelSpeed` radians a second up to `highestBarrel`, and is raised one radian for each `aimReach` metres.
 */
export const tank = {
  health: 100, thrust: 25.78, reverse: .6, recoil: .97, reloadTime: 1, burnBelow: .2,
  keep: { moving: .9 ** 30, standing: .7 ** 30 }, standingBelow: .0044,
  barrelSpeed: .5, highestBarrel: Math.PI * .2, aimReach: 259.6, shellSpeed: 20.24, shellFall: 3.61 / earthGravity,
}

/**
 * The hit box and the barrel of each tank in metres: its pivot ahead of the centre and above it, at the front of the
 * turret in the art and half its height, and its length from there.
 */
export const tankKinds = {
  partisan: { size: { length: 5.98, height: 2.55, width: 2.64 }, barrel: { ahead: .7, above: .7, length: 3.61 } },
  german: { size: { length: 6.51, height: 2.73, width: 2.9 }, barrel: { ahead: 1.1, above: .79, length: 3.29 } },
  somua: { size: { length: 7.57, height: 3.34, width: 1.85 }, barrel: { ahead: 2.32, above: .72, length: 1 } },
}

/**
 * The tank stands, drives ahead at its `cruise` share of the throttle, fires where its barrel points as often as it
 * reloads, or lies destroyed.
 */
const states = {
  idle: {},
  drive: { update: (body, dt) => body.drive(body.forward, dt, body.cruise) },
  fire: { update: body => body.shoot() },
  dead: {},
}

/**
 * A tank on flat ground: it faces right (yaw 0) or left (yaw π) and keeps between `bounds.min` and `bounds.max`.
 * `clock` is the game clock, so reloading, `reloadTime` seconds, waits in a pause; its shells hit the living ones of
 * `targets`, an array the scene owns, and leave play below `groundAt(x, z)`. It fires only while `canFire()`. With
 * no key held it rolls at its `march`, in metres a second, as in a column on the move, and stands by default.
 */
export default class Tank extends Body {
  constructor({ kind = tankKinds.partisan, clock, targets = [], bounds = { min: -Infinity, max: Infinity },
    groundAt = () => 0, cruise = 1, march = 0, reloadTime = tank.reloadTime, canFire = () => true, random = Math.random,
    ...rest } = {}) {
    super({ size: kind.size, health: tank.health, ...rest, states })
    Object.assign(this, { kind, targets, bounds, cruise, march, canFire })
    this.vx = march
    /** The barrel's angle above level, in radians. */
    this.elevation = tank.highestBarrel / 2
    this.reload = new Cooldown({ seconds: reloadTime, clock })
    this.shells = new ProjectilePool(() => new Shell({ gravity: this.gravity, fall: tank.shellFall, groundAt, random }))
  }

  /** The way it faces: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  get burning() {
    return this.health.current <= this.health.maximum * tank.burnBelow
  }

  /** Drives right (1) or left (-1): full thrust ahead, less in reverse; `power` is the share of the throttle. */
  drive(way, dt, power = 1) {
    this.vx += way * tank.thrust * (way === this.forward ? 1 : tank.reverse) * power * dt
  }

  raiseBarrel(dt) {
    this.elevation = Math.min(tank.highestBarrel, this.elevation + tank.barrelSpeed * dt)
  }

  lowerBarrel(dt) {
    this.elevation = Math.max(0, this.elevation - tank.barrelSpeed * dt)
  }

  get barrelLength() {
    return this.kind.barrel.length
  }

  /** Where the barrel turns, and its mouth. */
  get barrelPivot() {
    const { ahead, above } = this.kind.barrel
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  get muzzle() {
    const pivot = this.barrelPivot, { length } = this.kind.barrel
    return { x: pivot.x + this.forward * Math.cos(this.elevation) * length, y: pivot.y + Math.sin(this.elevation) * length, z: pivot.z }
  }

  /** Fires where the barrel points if it has reloaded, and recoils; returns whether it fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.reload.ready) return false
    this.reload.start()
    const shell = this.shells.fire(this.muzzle, this.yaw, this.elevation, tank.shellSpeed)
    shell.vx += this.vx
    shell.vz += this.vz
    this.shotsFired++
    this.vx -= this.forward * tank.recoil
    return true
  }

  /** As far as the barrel raised highest carries. */
  get reach() {
    return tank.highestBarrel * tank.aimReach
  }

  /** The shots of the barrel, as the point ahead and above it for each: level for a near target, high for a far one. */
  get shots() {
    return { straight: { x: 11.97, y: 0 }, up: { x: this.reach, y: 0 } }
  }

  /** Raises the barrel the more, the farther `point` is, if it is ahead: the turret does not turn round. */
  aimAt(point) {
    if (Math.sign(point.x - this.x) !== this.forward) return false
    this.elevation = Math.min(tank.highestBarrel, Math.hypot(point.x - this.x, point.y - this.y) / tank.aimReach)
    return true
  }

  takeHit(damage) {
    if (this.alive) this.vx -= this.forward * tank.recoil
    return super.takeHit(damage)
  }

  update(dt) {
    super.update(dt)
    // friction slows it to its march, on its own
    const own = this.vx - this.march
    const keep = Math.abs(own) > tank.standingBelow ? tank.keep.moving : tank.keep.standing
    this.vx = this.march + own * keep ** dt
    this.x = Math.min(Math.max(this.x, this.bounds.min), this.bounds.max)
    this.shells.update(dt, this.targets)
  }
}
