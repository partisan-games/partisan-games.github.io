import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'

/**
 * Measured from the earlier pixel tank at 22 px a metre and 30 frames a second. `thrust` is metres a second squared
 * at full drive, `reverse` its share driving back, `recoil` the push of a shot or a hit in metres a second; `keep` is
 * the share of speed kept each second, moving and almost standing, below `standingBelow` metres a second. The barrel
 * turns `barrelSpeed` radians a second up to `highestBarrel`, and is raised one radian for each `aimReach` metres.
 */
export const tank = {
  health: 100, thrust: 29.3, reverse: .6, recoil: 1.1, reloadTime: 1, burnBelow: 20,
  keep: { moving: .9 ** 30, standing: .7 ** 30 }, standingBelow: .005,
  barrelSpeed: .5, highestBarrel: Math.PI * .2, aimReach: 295, shellSpeed: 23, shellGravity: 4.1,
}

/**
 * The hit box and the barrel of each tank in metres: its pivot ahead of the centre and above it, at the front of the
 * turret in the art and half its height, and its length from there.
 */
export const tankKinds = {
  partisan: { size: { length: 6.8, height: 2.9, width: 3 }, barrel: { ahead: .8, above: .8, length: 4.1 } },
  german: { size: { length: 7.4, height: 3.1, width: 3.3 }, barrel: { ahead: 1.25, above: .9, length: 3.74 } },
}

/** The tank stands, drives ahead, fires where its barrel points as often as it reloads, or lies destroyed. */
const states = {
  idle: {},
  drive: { update: (body, dt) => body.drive(body.forward, dt) },
  fire: { update: body => body.shoot() },
  dead: { enter: body => body.health.damage(body.health.current) },
}

/**
 * A tank on flat ground: it faces right (yaw 0) or left (yaw π) and keeps between `bounds.min` and `bounds.max`.
 * `clock` is the game clock, so reloading waits in a pause; its shells hit the living ones of `targets`, an array the
 * scene owns, and leave play below `groundAt(x, z)`.
 */
export default class Tank extends Body {
  constructor({ kind = tankKinds.partisan, clock, targets = [], bounds = { min: -Infinity, max: Infinity },
    groundAt = () => 0, random = Math.random, ...rest } = {}) {
    super({ size: kind.size, health: tank.health, ...rest, states })
    this.kind = kind
    this.targets = targets
    this.bounds = bounds
    /** The barrel's angle above level, in radians. */
    this.elevation = tank.highestBarrel / 2
    this.reload = new Cooldown({ seconds: tank.reloadTime, clock })
    this.shells = new ProjectilePool(() => new Shell({ gravity: tank.shellGravity, groundAt, random }))
  }

  /** The way it faces: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  get burning() {
    return this.health.current <= tank.burnBelow
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
    if (this.dead || !this.reload.ready) return false
    this.reload.start()
    this.shells.fire(this.muzzle, this.yaw, this.elevation, tank.shellSpeed)
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
    return { straight: { x: 13.6, y: 0 }, up: { x: this.reach, y: 0 } }
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
    const keep = Math.abs(this.vx) > tank.standingBelow ? tank.keep.moving : tank.keep.standing
    this.vx *= keep ** dt
    this.x = Math.min(Math.max(this.x, this.bounds.min), this.bounds.max)
    this.shells.update(dt, this.targets)
  }
}
