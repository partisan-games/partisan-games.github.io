import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { turn } from '../../angles.js'

/**
 * A machine-gun nest on a river bank seen from above: its sandbagged ring, as large as a real one, how far its gun
 * stands behind the ring's middle and how long the gun is, in metres; how far the gun swings either way from straight
 * out over the water and how fast it turns, in radians and radians a second; seconds between rounds; rounds in a burst
 * and seconds between bursts; its rounds' speed in metres a second and damage; and its health.
 */
export const nest = {
  size: { length: 4.8, height: 1.2, width: 1.92 }, mount: .32, gun: 1.2, swing: Math.PI * .4, turn: 1.8, interval: .14,
  burst: 4, burstWait: 4.5, bulletSpeed: 24, damage: 3, health: 30,
}

/**
 * The nest holds fire, or fires bursts where it aims, or lies destroyed. Opening fire swings the gun straight to its aim
 * and fires at once.
 */
const states = {
  idle: { enter: gun => gun.disengage() },
  fire: { update: (gun, dt) => gun.fireBurst(dt) },
  dead: {},
}

/**
 * A stationary infantry position on the bank on `side` of the river, -1 the far one, at the top of the view, or 1 the
 * near one; its gun points out over the water. Its rounds hit the living ones of `targets`; `clock` is the game clock,
 * and it fires only while `canFire()`.
 */
export default class ShoreMachineGun extends Body {
  constructor({ side = -1, clock, targets = [], canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: nest.size, health: nest.health, ...rest, states, yaw: side < 0 ? 0 : Math.PI })
    Object.assign(this, { side, targets, canFire })
    /** Straight out over the water: down the view from the far bank, up it from the near one. */
    this.water = side < 0 ? -Math.PI / 2 : Math.PI / 2
    this.gunYaw = this.water
    this.bearing = null
    this.engaged = false
    this.rounds = 0
    this.reload = new Cooldown({ seconds: nest.interval, clock })
    this.burstWait = new Cooldown({ seconds: nest.burstWait, clock })
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: nest.damage, max: nest.damage }, random }))
  }

  /** The crew faces along the bank. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** Straight out over the water. */
  get shots() {
    return { straight: { x: 0, y: 0, z: -this.side * 8 } }
  }

  get reach() {
    return Infinity
  }

  /** Where its gun stands, a little behind the nest's middle on the land side. */
  get mount() {
    return { x: this.x, y: this.y, z: this.z - this.side * nest.mount }
  }

  get muzzle() {
    const { mount } = this
    return { x: mount.x + Math.cos(this.gunYaw) * nest.gun, y: mount.y, z: mount.z - Math.sin(this.gunYaw) * nest.gun }
  }

  /** Swings the aim towards `point`, as far as the nest allows; it can fire only at a point out over the water. */
  aimAt(point) {
    const { mount } = this
    const toward = Math.atan2(-(point.z - mount.z), point.x - mount.x)
    this.bearing = this.water + Math.max(-nest.swing, Math.min(nest.swing, turn(this.water, toward)))
    return (point.z - mount.z) * this.side < 0
  }

  disengage() {
    this.engaged = false
    this.rounds = 0
  }

  /** Swings to its aim and fires the rounds of its burst as it reloads, while it may. */
  fireBurst(dt) {
    if (!this.canFire() || this.bearing === null) return this.disengage()
    if (!this.engaged) {
      this.engaged = true
      this.gunYaw = this.bearing
      this.burstWait.start(0)
      this.reload.start(0)
    }
    const step = nest.turn * dt
    this.gunYaw += Math.max(-step, Math.min(step, turn(this.gunYaw, this.bearing)))
    if (!this.burstWait.ready || !this.reload.ready) return
    this.bullets.fire(this.muzzle, this.gunYaw, 0, nest.bulletSpeed)
    this.shotsFired++
    this.reload.start()
    if (++this.rounds < nest.burst) return
    this.rounds = 0
    this.burstWait.start()
  }

  /** Its rounds in the air still hit after it is destroyed. */
  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
