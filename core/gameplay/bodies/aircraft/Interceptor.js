import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A fighter that hunts a bomber, in the bomber's own frame, where the world flows past: it closes at `speed` metres a
 * second, turns `turn` radians a second, and fires bursts at it when it is within `range` metres and `cone` radians
 * of its nose, a round every `interval` seconds, flying at `bulletSpeed` for `life` seconds and taking `damage` off.
 * Nearer than `breakAway` it pulls away, and comes round again once `reach` metres off; it keeps between `floor` and
 * `ceiling` metres above the ground. Shot down, it dives at `fall` metres a second, rolling `crashRoll` a second.
 */
export const interceptor = { speed: 45, turn: 1.2, range: 150, cone: .15, interval: .15, bulletSpeed: 160, life: 1.5,
  damage: { min: 4, max: 8 }, health: 120, breakAway: 30, reach: 220, floor: 12, ceiling: 70, fall: 18, crashRoll: 2 }

/** The rate at which a heading turns toward `to` from `from`, both in radians, the short way round. */
const turnToward = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

const states = {
  /** It flies at its target and fires when it has it in its sights. */
  attack: {
    update: (plane, dt) => {
      plane.steerTo(plane.target, dt)
      if (plane.distance < interceptor.breakAway) plane.breakAway()
      else if (plane.inSights) plane.fire()
    },
  },
  /** It flies on the way it broke away until far enough to turn and come again. */
  extend: {
    update: (plane, dt) => {
      plane.steerTo(plane.goal, dt)
      if (plane.distance > interceptor.reach) plane.setState('attack')
    },
  },
  dead: {},
}

/**
 * An enemy fighter, which makes pass after pass at `target`, a body, firing at it; `groundAt(x, z)` is the ground under
 * it and `clock` the game clock. Shot down, it falls to the ground and lies there.
 */
export default class Interceptor extends Body {
  constructor({ target, clock, groundAt = () => 0, size = { length: 4, height: 1.5, width: 4 }, ...rest } = {}) {
    super({ size, health: interceptor.health, ...rest, states, initial: 'attack' })
    Object.assign(this, { target, groundAt, speed: interceptor.speed })
    this.roll = 0
    this.landing = false
    this.goal = null
    this.reload = new Cooldown({ seconds: interceptor.interval, clock })
    this.rounds = new ProjectilePool(() => new Bullet({ life: interceptor.life, damage: interceptor.damage }))
    this.aim()
  }

  /** How far its target is, in metres. */
  get distance() {
    const { target } = this
    return Math.hypot(target.x - this.x, target.y - this.y, target.z - this.z)
  }

  /** Whether its living target is within range and in front of its nose. */
  get inSights() {
    const { target } = this
    if (!target.alive || this.distance > interceptor.range) return false
    const way = { x: target.x - this.x, y: target.y - this.y, z: target.z - this.z }
    const yaw = Math.atan2(-way.z, way.x), pitch = Math.atan2(way.y, Math.hypot(way.x, way.z))
    return Math.abs(turnToward(this.yaw, yaw)) < interceptor.cone && Math.abs(pitch - this.pitch) < interceptor.cone
  }

  get airborne() {
    return this.y > this.groundAt(this.x, this.z) + this.size.height / 2
  }

  /** Points its nose straight at its target. */
  aim() {
    const { target } = this
    const way = { x: target.x - this.x, y: target.y - this.y, z: target.z - this.z }
    this.yaw = Math.atan2(-way.z, way.x)
    this.pitch = Math.atan2(way.y, Math.hypot(way.x, way.z))
  }

  /** Turns its nose toward `point` as fast as it can, banking into the turn, and flies on along it. */
  steerTo(point, dt) {
    const way = { x: point.x - this.x, y: point.y - this.y, z: point.z - this.z }
    const step = interceptor.turn * dt
    const yawTurn = turnToward(this.yaw, Math.atan2(-way.z, way.x))
    const pitchTurn = Math.atan2(way.y, Math.hypot(way.x, way.z)) - this.pitch
    this.yaw += Math.max(-step, Math.min(step, yawTurn))
    this.pitch += Math.max(-step, Math.min(step, pitchTurn))
    this.roll += (Math.max(-1, Math.min(1, yawTurn)) - this.roll) * Math.min(1, dt * 3)
    const ground = this.groundAt(this.x, this.z)
    if (this.y < ground + interceptor.floor) this.pitch = Math.max(this.pitch, .2)
    if (this.y > ground + interceptor.ceiling) this.pitch = Math.min(this.pitch, -.2)
    const level = Math.cos(this.pitch) * this.speed
    this.vx = Math.cos(this.yaw) * level
    this.vy = Math.sin(this.pitch) * this.speed
    this.vz = -Math.sin(this.yaw) * level
  }

  /** Pulls away the way it flies, to a point `reach` metres on, and from there comes round again. */
  breakAway() {
    this.goal = this.ahead(interceptor.reach * 1.5)
    this.goal.y = this.target.y + interceptor.floor
    this.setState('extend')
  }

  /** Fires a round along its nose if it has reloaded. */
  fire() {
    if (!this.reload.ready) return
    this.rounds.fire(this.ahead(this.size.length / 2), this.yaw, this.pitch, interceptor.bulletSpeed)
    this.shotsFired++
    this.reload.start()
  }

  update(dt) {
    if (this.dead && this.airborne) {
      this.vy = -interceptor.fall
      this.roll += interceptor.crashRoll * dt
    }
    super.update(dt)
    if (this.dead && !this.airborne) {
      this.vx = this.vy = this.vz = 0
      this.y = this.groundAt(this.x, this.z) + this.size.height / 2
    }
    this.rounds.update(dt, [this.target])
  }
}
