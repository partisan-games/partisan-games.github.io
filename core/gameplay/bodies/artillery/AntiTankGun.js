import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'
import { tank } from '../vehicles/Tank.js'
import { lowArc } from '../ballistics.js'

/**
 * A towed anti-tank gun: seconds between shots and before its first, and its health, which any shell takes. Its shells
 * fly as the tank's do. Its barrel turns about a pivot ahead of its middle and above it, and is `length` long, in metres.
 */
export const antiTankGun = { reload: 4.5, firstShot: 1.5, health: 10, barrel: { ahead: .67, above: .36, length: 2.26 } }

/** The gun holds fire, or fires its laid shot as often as it reloads, or lies destroyed. */
const states = {
  idle: {},
  fire: { update: gun => gun.shoot() },
  dead: {},
}

/**
 * A PaK 38 facing right (yaw 0) or left (yaw π). It lays its barrel on the low arc to a point ahead; its shells hit
 * the living ones of `targets` and leave play below `groundAt(x)`. `clock` is the game clock, and it fires only while
 * `canFire()`.
 */
export default class AntiTankGun extends Body {
  constructor({ clock, targets = [], groundAt = () => 0, canFire = () => true, random = Math.random, ...rest } = {}) {
    super({ size: { length: 5.85, height: 1.28, width: 1.58 }, health: antiTankGun.health, ...rest, states })
    Object.assign(this, { targets, canFire })
    /** The barrel's angle above level, and whether it is laid on a point it can reach. */
    this.elevation = 0
    this.laid = false
    this.reload = new Cooldown({ seconds: antiTankGun.reload, clock })
    this.reload.start(antiTankGun.firstShot)
    this.shells = new ProjectilePool(() => new Shell({ gravity: this.gravity, fall: tank.shellFall, groundAt, random }))
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  get barrelLength() {
    return antiTankGun.barrel.length
  }

  get barrelPivot() {
    const { ahead, above } = antiTankGun.barrel
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  get muzzle() {
    const pivot = this.barrelPivot, { length } = antiTankGun.barrel
    return { x: pivot.x + this.forward * Math.cos(this.elevation) * length, y: pivot.y + Math.sin(this.elevation) * length, z: pivot.z }
  }

  /** As far as its shell carries at the best angle. */
  /** How hard its shells are pulled down. */
  get shellPull() {
    return this.gravity * tank.shellFall
  }

  get reach() {
    return tank.shellSpeed ** 2 / this.shellPull
  }

  /** A target near and level, and one far off. */
  get shots() {
    return { straight: { x: 14.96, y: 0 }, up: { x: 35.2, y: 0 } }
  }

  /** Lays the barrel on the low arc to `point` ahead, solved from its muzzle, which turns with it; returns whether. */
  aimAt(point) {
    this.laid = false
    if (Math.sign(point.x - this.x) !== this.forward) return false
    let elevation = lowArc(this.barrelPivot, point, tank.shellSpeed, this.shellPull)
    for (let i = 0; i < 12 && elevation !== null; i++) {
      this.elevation = elevation
      elevation = lowArc(this.muzzle, point, tank.shellSpeed, this.shellPull)
    }
    if (elevation === null) return false
    this.elevation = elevation
    this.laid = true
    return true
  }

  /** Fires the laid shot if it has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.laid || !this.canFire() || !this.reload.ready) return false
    this.shells.fire(this.muzzle, this.yaw, this.elevation, tank.shellSpeed)
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** Shells already in the air still hit after the gun is destroyed. */
  update(dt) {
    super.update(dt)
    this.shells.update(dt, this.targets)
  }
}
