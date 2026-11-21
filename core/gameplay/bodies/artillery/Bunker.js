import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * The machine gun of a bunker: seconds between rounds, rounds in a burst, seconds of rest after a burst and before the
 * first, the round speed in metres a second, and the little of a tank's health a round takes; and the bunker's health,
 * which any shell takes.
 */
export const bunker = { reload: .13, burst: 5, pause: 4, firstShot: 1.5, speed: 35.99, damage: 3, health: 10 }

/**
 * Each kind of bunker: its hit box in metres and where its gun fires from, ahead of its middle and above it: a
 * concrete pillbox through its loophole, the fortified house through the gun of its machine gunner, who lies in the
 * window it faces with.
 */
export const bunkerKinds = {
  pillbox: { size: { length: 6.16, height: 2.32, width: 3.52 }, muzzle: { ahead: 1.72, above: -.23 } },
  house: { size: { length: 7.04, height: 4.72, width: 5.28 }, muzzle: { ahead: 3.59, above: -.38 } },
}

/** The bunker holds fire, or fires bursts where it aims, or stands destroyed. */
const states = {
  idle: {},
  fire: { update: body => body.shoot() },
  dead: {},
}

/**
 * A fortified machine gun by the road, facing right (yaw 0) or left (yaw π); it fires its bursts anywhere it aims.
 * Its rounds hit the living ones of `targets`. `clock` is the game clock, and it fires only while `canFire()`.
 */
export default class Bunker extends Body {
  constructor({ kind = bunkerKinds.pillbox, clock, targets = [], canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: kind.size, health: bunker.health, ...rest, states })
    Object.assign(this, { kind, targets, canFire })
    this.aimPoint = null
    this.reload = new Cooldown({ seconds: bunker.reload, clock })
    this.pause = new Cooldown({ seconds: bunker.pause, clock })
    this.pause.start(bunker.firstShot)
    this.burstFired = 0
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: bunker.damage, max: bunker.damage }, random }))
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  get muzzle() {
    const { ahead, above } = this.kind.muzzle
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  get reach() {
    return Infinity
  }

  get shots() {
    return { straight: { x: 14.96, y: 0 } }
  }

  /** Its gun turns anywhere. */
  aimAt(point) {
    this.aimPoint = { x: point.x, y: point.y }
    return true
  }

  /** The angle from the muzzle to where it aims, from +x. */
  get aimAngle() {
    const { muzzle, aimPoint } = this
    return aimPoint ? Math.atan2(aimPoint.y - muzzle.y, aimPoint.x - muzzle.x) : this.forward > 0 ? 0 : Math.PI
  }

  /** Fires a round of the burst if it may and has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.aimPoint || !this.canFire() || !this.reload.ready || !this.pause.ready) return false
    const angle = this.aimAngle
    this.bullets.fire(this.muzzle, Math.cos(angle) < 0 ? Math.PI : 0, Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle))), bunker.speed)
    this.shotsFired++
    this.reload.start()
    if (++this.burstFired < bunker.burst) return true
    this.burstFired = 0
    this.pause.start()
    return true
  }

  /** Rounds already in the air still hit after the bunker falls. */
  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
