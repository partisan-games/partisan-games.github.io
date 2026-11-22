import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { hullEntry } from '../projectiles/hits.js'
import { turn } from '../../angles.js'

/**
 * A German S-boat seen from above: cruising and full speed in
 * metres a second; how fast the hull and the guns turn, in radians a second; seconds between rounds; rounds in a burst
 * and seconds between bursts and before the first; the nearest and farthest its guns fire, in metres, once they are on
 * aim within `onAim` radians; its bullets' speed and damage; its health, as the strongest enemy of Čamac (its
 * "kraljica"), some thirty rounds of the partisan boat; and the seconds its sinking hull stays a
 * surface the boats run into, and the seconds it takes to sink out of sight.
 */
export const sBoat = {
  cruise: 4.4, full: 6.8, turn: .65, gunTurn: 1.2, interval: .22, burst: 3, burstWait: 4, firstBurst: 1.8, nearest: 6.4,
  reach: 26, onAim: .08, bulletSpeed: 20, damage: 5, health: 300, surfaceTime: 2.6, sinkTime: 5,
}
/** Its two deck guns, as shares of its length ahead of its middle. */
const mounts = [-84 / 300, 101 / 300]

/** It sails at cruising speed towards its `course`, or, once it withdraws, back down the river at full speed. */
const sail = (boat, dt) => {
  const [course, speed] = boat.withdrawing ? [0, sBoat.full] : [boat.course, sBoat.cruise]
  const step = sBoat.turn * dt
  boat.yaw += Math.max(-step, Math.min(step, turn(boat.yaw, course)))
  boat.vx = Math.cos(boat.yaw) * speed
  boat.vz = -Math.sin(boat.yaw) * speed
}

/**
 * The boat lies still, or sails (`move`), or sails firing its deck guns where they aim (`attack`), or sinks. Its guns
 * follow their aim in any state while it lives.
 */
const states = {
  idle: {
    enter: boat => {
      boat.vx = boat.vz = 0
    },
  },
  move: { update: sail },
  attack: {
    update: (boat, dt) => {
      sail(boat, dt)
      boat.fireBurst()
    },
  },
  dead: {
    enter: boat => {
      boat.vx = boat.vz = 0
    },
  },
}

/**
 * A single approach and withdrawal with independently trained deck guns, heading along `yaw` (π up the river, to the
 * left). Its rounds hit the living ones of `targets`; `clock` is the game clock, and it fires only while `canFire()`.
 * Who sets its `course` and its state, and when it withdraws, is up to the world; `born` is when its pass began,
 * `bursts` how many it has fired, and `lane` the height of the river it keeps to.
 */
export default class SBoat extends Body {
  constructor({ lane = 0, clock, targets = [], canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: { length: 32.76, height: 1.2, width: 5.06 }, health: sBoat.health, yaw: Math.PI, ...rest, states })
    Object.assign(this, { lane, targets, canFire, clock })
    this.course = this.yaw
    this.gunYaw = this.yaw
    this.gunIndex = 0
    this.rounds = this.bursts = 0
    this.aim = null
    this.withdrawing = false
    this.born = clock?.now ?? 0
    this.reload = new Cooldown({ seconds: sBoat.interval, clock })
    this.burstWait = new Cooldown({ seconds: sBoat.burstWait, clock })
    this.burstWait.start(sBoat.firstBurst)
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: sBoat.damage, max: sBoat.damage }, random }))
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** It turns back for good and sails away at full speed, holding fire. */
  withdraw() {
    this.withdrawing = true
    if (this.alive) this.setState('move')
  }

  /** What a story can ask of it once. */
  get acts() {
    return ['withdraw']
  }

  act(name) {
    if (name === 'withdraw') this.withdraw()
  }

  /** The deck guns turn all round; this one is straight ahead. */
  get shots() {
    return { straight: { x: 12, y: 0 } }
  }

  get reach() {
    return sBoat.reach
  }

  /** Whether its sinking hull still lies on the water, and whether it has sunk out of sight. */
  get afloat() {
    return this.dead && this.stateTime < sBoat.surfaceTime
  }

  get sunk() {
    return this.dead && this.stateTime >= sBoat.sinkTime
  }

  mount(index) {
    const along = mounts[index] * this.size.length
    return { x: this.x + Math.cos(this.yaw) * along, y: this.y, z: this.z - Math.sin(this.yaw) * along }
  }

  get muzzle() {
    const mount = this.mount(this.gunIndex)
    const ahead = this.size.length * 12 / 300
    return { x: mount.x + Math.cos(this.gunYaw) * ahead, y: mount.y, z: mount.z - Math.sin(this.gunYaw) * ahead }
  }

  /** Trains the guns on `point`; they can fire at it if it is within their reach. */
  aimAt(point) {
    this.aim = { x: point.x, z: point.z }
    const mount = this.mount(this.gunIndex)
    const distance = Math.hypot(point.x - mount.x, point.z - mount.z)
    return distance >= sBoat.nearest && distance <= sBoat.reach
  }

  /** The bearing from the gun to its aim. */
  get bearing() {
    const mount = this.mount(this.gunIndex)
    return Math.atan2(-(this.aim.z - mount.z), this.aim.x - mount.x)
  }

  /** Fires the next round of its burst, from the gun whose turn it is, once that gun is on aim and in reach. */
  fireBurst() {
    if (!this.aim || !this.canFire() || !this.burstWait.ready || !this.reload.ready) return false
    const mount = this.mount(this.gunIndex)
    const distance = Math.hypot(this.aim.x - mount.x, this.aim.z - mount.z)
    if (distance < sBoat.nearest || distance > sBoat.reach || Math.abs(turn(this.gunYaw, this.bearing)) > sBoat.onAim) return false
    this.bullets.fire(this.muzzle, this.gunYaw, 0, sBoat.bulletSpeed)
    this.shotsFired++
    this.reload.start()
    this.gunIndex = (this.gunIndex + 1) % mounts.length
    if (++this.rounds < sBoat.burst) return true
    this.rounds = 0
    this.bursts++
    this.burstWait.start()
    return true
  }

  hitTime(start, end) {
    return hullEntry({ start, end }, this)
  }

  /** Its guns follow their aim while it lives; its rounds in the air hit after it sinks. */
  update(dt) {
    super.update(dt)
    if (this.alive && this.aim) {
      const step = sBoat.gunTurn * dt
      this.gunYaw += Math.max(-step, Math.min(step, turn(this.gunYaw, this.bearing)))
    }
    this.bullets.update(dt, this.targets)
  }
}
