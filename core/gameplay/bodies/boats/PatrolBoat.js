import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { hullEntry } from '../projectiles/hits.js'
import { turn } from '../../angles.js'
import profiles from '../../patrolBoatProfiles.js'
import reinforcementVessels from '../../reinforcementVessels.js'

export const patrolBoatKinds = {
  ...reinforcementVessels,
  'german-skiff': { ...profiles['german-skiff'], speed: 5.6, health: 30 },
  'german-launch': { ...profiles['german-launch'], speed: 4.8, health: 60 },
  'german-patrol-vessel': { ...profiles['german-patrol-vessel'], speed: 3.8, health: 120 },
}
export const patrolBoat = { turn: 1.1, reach: 25, interval: .22, burst: 3, wait: 2.5, damage: 3, surface: 2.6, sink: 5 }
const stop = body => {
  body.vx = body.vz = 0
}
const states = {
  idle: { enter: stop },
  move: { update: (body, dt) => body.sail(dt) },
  attack: { update: (body, dt) => {
    body.sail(dt)
    body.shoot()
  } },
  dead: { enter: stop },
}

/** An enemy vessel with a fixed gun: the hull turns to bring its barrel onto the target. */
export default class PatrolBoat extends Body {
  constructor({ kind = patrolBoatKinds['german-launch'], clock, targets = [], random = Math.random,
    canFire = () => true, lane = 0, view = null, ...options } = {}) {
    super({ size: kind.size, health: kind.health, yaw: Math.PI, ...options, states })
    Object.assign(this, { kind, clock, targets, canFire, lane })
    this.course = this.yaw
    this.rounds = this.bursts = 0
    this.aim = null
    this.reload = new Cooldown({ seconds: patrolBoat.interval, clock })
    this.wait = new Cooldown({ seconds: patrolBoat.wait, clock })
    this.wait.start(1)
    this.bullets = new ProjectilePool(() => new Bullet({ view, random,
      damage: { min: patrolBoat.damage, max: patrolBoat.damage } }))
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }
  get reach() {
    return patrolBoat.reach
  }
  get shots() {
    return { straight: { x: 12, y: 0 } }
  }
  get afloat() {
    return this.dead && this.stateTime < patrolBoat.surface
  }
  get sunk() {
    return this.dead && this.stateTime >= patrolBoat.sink
  }
  get bearing() {
    const origin = this.muzzle
    return Math.atan2(origin.z - this.aim.z, this.aim.x - origin.x) - (this.kind.gunOffset ?? 0)
  }

  get gunYaw() {
    return this.yaw + (this.kind.gunOffset ?? 0)
  }

  get muzzle() {
    const { ahead, across } = this.kind.muzzle
    return { x: this.x + Math.cos(this.yaw) * ahead + Math.sin(this.yaw) * across, y: this.y,
      z: this.z - Math.sin(this.yaw) * ahead + Math.cos(this.yaw) * across }
  }

  aimAt(point) {
    this.aim = { x: point.x, z: point.z }
    return Math.hypot(point.x - this.muzzle.x, point.z - this.muzzle.z) <= this.reach
  }

  sail(dt) {
    const heading = this.state === 'attack' && this.aim ? this.bearing : this.course
    const step = patrolBoat.turn * dt
    this.yaw += Math.max(-step, Math.min(step, turn(this.yaw, heading)))
    this.vx = Math.cos(this.yaw) * this.kind.speed
    this.vz = -Math.sin(this.yaw) * this.kind.speed
  }

  shoot() {
    if (this.dead || !this.aim || !this.canFire() || !this.reload.ready || !this.wait.ready) return false
    if (Math.hypot(this.aim.x - this.muzzle.x, this.aim.z - this.muzzle.z) > this.reach || Math.abs(turn(this.yaw, this.bearing)) > .1) return false
    this.bullets.fire(this.muzzle, this.gunYaw, 0, 24)
    this.shotsFired++
    this.reload.start()
    if (++this.rounds >= patrolBoat.burst) {
      this.rounds = 0
      this.bursts++
      this.wait.start()
    }
    return true
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  hitTime(start, end) {
    return hullEntry({ start, end }, this)
  }

  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
