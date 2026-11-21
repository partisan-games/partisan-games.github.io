import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * The machine gun seen from above: seconds between rounds, rounds in a burst, seconds of rest after a burst and before
 * the first, the round speed in metres a second, and where the muzzle is from the gunner's place: `ahead` of it and to
 * his right, `side`, as his gun is drawn. Measured from the earlier pixel gunner at 40 px a metre, where a man is
 * 1.8 m tall.
 */
export const machineGun = { reload: .1, burst: 5, pause: 3, speed: 15, muzzle: { ahead: 1.55, side: .3 } }

/** The gunner holds fire, or fires bursts where he aims as often as his gun allows, or lies dead. */
const states = {
  idle: {},
  fire: { update: gunner => gunner.shoot() },
  dead: {},
}

/**
 * A machine gunner lying behind his gun, seen from above, who turns it anywhere; his place is the gun's pivot. His
 * rounds hit the living ones of `targets` and kill with one hit. `clock` is the game clock, and he fires only while
 * `canFire()`.
 */
export default class MachineGunner extends Body {
  constructor({ clock, targets = [], canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: { length: 1.575, height: 1, width: .675 }, health: 1, yaw: Math.PI, ...rest, states })
    Object.assign(this, { targets, canFire })
    this.reload = new Cooldown({ seconds: machineGun.reload, clock })
    this.pause = new Cooldown({ seconds: machineGun.pause, clock })
    this.pause.start()
    this.burstFired = 0
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: 100, max: 100 }, random }))
  }

  /** The way the gun points across the view: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** The gun turns all round, so each shot is a point ahead of him, level or across. */
  get shots() {
    return { straight: { x: 10, y: 0 }, up: { x: 5, y: 0, z: -10 } }
  }

  get reach() {
    return Infinity
  }

  get muzzle() {
    const { ahead, side } = machineGun.muzzle, cos = Math.cos(this.yaw), sin = Math.sin(this.yaw)
    return { x: this.x + cos * ahead + sin * side, y: this.y, z: this.z - sin * ahead + cos * side }
  }

  /** Turns the gun to `point`, which is always within his turn. */
  aimAt(point) {
    this.yaw = Math.atan2(-((point.z ?? this.z) - this.z), point.x - this.x)
    return true
  }

  /** Fires a round of the burst if he may and has reloaded; returns whether he fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.pause.ready || !this.reload.ready) return false
    this.bullets.fire(this.muzzle, this.yaw, 0, machineGun.speed)
    this.shotsFired++
    this.reload.start()
    if (++this.burstFired < machineGun.burst) return true
    this.burstFired = 0
    this.pause.start()
    return true
  }

  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
