import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import FlakShell from '../projectiles/FlakShell.js'
import { turn } from '../../angles.js'

/**
 * Light anti-aircraft fire: how far the gun reaches, in metres, the seconds between shots, the shell speed in metres
 * a second, how close to a burst a target is hit, how much of a plane's health one hit takes (five bring it down),
 * and the gun's own health in bullet damage. A shell bursts before the next shot, so one shell is enough. Measured
 * from the earlier pixel gun at 30.8 px a metre.
 */
export const flak = { reach: 32.5, reload: 3, shellSpeed: 19.5, burstRadius: 2.27, damage: 20, health: 30 }
/**
 * The barrel turns about its breech, ahead of the gun's centre and above it, in metres; it is `length` long and
 * rests leaning left at `rest` radians from +x. It turns at `rate` radians a second, no lower than `lowest` above
 * the horizon either side, and fires only when it points within `onTarget` of where the gun aims.
 */
export const barrel = { breech: { x: .05, y: .41 }, length: 1.39, rest: 2.29, rate: 1.5, lowest: .15, onTarget: .1 }

/**
 * A crew at ease leaves the gun alone; set to fire, it trains the barrel where it aims and fires once on target; a
 * destroyed gun lies still.
 */
const states = {
  idle: {},
  fire: {
    update: (gun, dt) => {
      gun.trainBarrel(dt)
      gun.fire()
    },
  },
  dead: {},
}

/**
 * A light anti-aircraft gun. Its shell bursts where it aims and hurts the living ones of `targets` close by. `clock`
 * is the game clock, so reloading waits in a pause, and it fires only while `canFire()`.
 */
export default class Flak extends Body {
  constructor({ clock, targets = [], canFire = () => true, random = Math.random, ...rest } = {}) {
    super({ size: { length: 4.96, height: 2.97, width: 1.43 }, health: flak.health, ...rest, states })
    Object.assign(this, { targets, canFire })
    /** Where the shell is to burst, once the gun has aimed. */
    this.aimPoint = null
    /** Where the barrel points, in radians from +x: straight up is π/2. */
    this.barrelAngle = barrel.rest
    this.reload = new Cooldown({ seconds: flak.reload, clock })
    // guns that come into view together do not fire together
    this.reload.start(random() * flak.reload)
    this.shell = new FlakShell({ onBurst: shell => this.burst(shell) })
  }

  /** The barrel is drawn leaning left, but it turns to either side. */
  get forward() {
    return -1
  }

  get reach() {
    return flak.reach
  }

  /** The barrel low over the horizon, and steep. */
  get shots() {
    return { straight: { x: 26, y: 6.5 }, up: { x: 9.71, y: 19.5 } }
  }

  get breech() {
    return { x: this.x + barrel.breech.x, y: this.y + barrel.breech.y, z: this.z }
  }

  get muzzle() {
    const { x, y, z } = this.breech
    return { x: x + Math.cos(this.barrelAngle) * barrel.length, y: y + Math.sin(this.barrelAngle) * barrel.length, z }
  }

  /** Aims at `point` if it is above the breech and in reach, and gives whether it is. */
  aimAt(point) {
    const { breech } = this
    if (point.y <= breech.y || Math.hypot(point.x - breech.x, point.y - breech.y) > flak.reach) return false
    this.aimPoint = { x: point.x, y: point.y }
    return true
  }

  /** The angle from the breech to where the gun aims. */
  get aimAngle() {
    const { breech, aimPoint } = this
    return Math.atan2(aimPoint.y - breech.y, aimPoint.x - breech.x)
  }

  /** Turns the barrel towards where the gun aims, as fast as it can, never below the horizon. */
  trainBarrel(dt) {
    if (!this.aimPoint) return
    const wanted = Math.min(Math.PI - barrel.lowest, Math.max(barrel.lowest, this.aimAngle))
    const step = barrel.rate * dt
    this.barrelAngle += Math.max(-step, Math.min(step, turn(this.barrelAngle, wanted)))
  }

  /** Fires the shell, fused to burst where the gun aims, once the barrel points there; returns whether it fired. */
  fire() {
    if (this.dead || !this.canFire() || !this.reload.ready || !this.aimPoint) return false
    if (Math.abs(turn(this.barrelAngle, this.aimAngle)) > barrel.onTarget) return false
    const { breech, aimPoint, barrelAngle } = this
    const fuse = Math.hypot(aimPoint.x - breech.x, aimPoint.y - breech.y) / flak.shellSpeed
    const yaw = Math.cos(barrelAngle) < 0 ? Math.PI : 0
    this.shell.launch(this.muzzle, yaw, Math.atan2(Math.sin(barrelAngle), Math.abs(Math.cos(barrelAngle))), flak.shellSpeed, fuse)
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** Every living target close to the burst is hit, while the gun may fire. */
  burst({ x, y }) {
    if (!this.canFire()) return
    for (const target of this.targets)
      if (target.alive && Math.hypot(target.x - x, target.y - y) <= flak.burstRadius) target.takeHit(flak.damage)
  }

  /** A shell already in the air still bursts after the gun is destroyed. */
  update(dt) {
    super.update(dt)
    this.shell.update(dt)
  }
}
