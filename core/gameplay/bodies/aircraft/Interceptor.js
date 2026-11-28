import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A fighter that hunts a bomber, in the bomber's own frame, where the world flows past: it closes at `speed` metres a
 * second, turns `turn` radians a second, and fires bursts at it when it is within `range` metres and `cone` radians
 * of its nose, a round every `interval` seconds, flying at `bulletSpeed` for `life` seconds and taking `damage` off.
 * Nearer than `breakAway` it pulls away, and comes round again once `reach` metres off; it keeps between `floor` and
 * `ceiling` metres above the ground. Shot down, it dives at `fall` metres a second, rolling `crashRoll` a second; set to
 * land, it glides down `glide` radians nose down and on the ground slows by `brake` metres a second each second.
 * Flown by a player, it climbs or dives at up to `climb` radians.
 */
export const interceptor = { speed: 45, turn: 1.2, range: 150, cone: .15, interval: .15, bulletSpeed: 160, life: 1.5,
  damage: { min: 20, max: 30 }, health: 120, breakAway: 30, reach: 220, floor: 12, ceiling: 140, fall: 18, crashRoll: 2,
  glide: .15, brake: 6, climb: .5 }

/** The rate at which a heading turns toward `to` from `from`, both in radians, the short way round. */
const turnToward = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

const states = {
  /** It flies straight on, wings level, holding its fire. */
  move: {
    update: (plane, dt) => plane.fly(0, dt),
  },
  /** It glides down to the ground and rolls to a stop, for good. */
  land: {
    update: (plane, dt) => {
      if (!plane.airborne) plane.speed = Math.max(0, plane.speed - interceptor.brake * dt)
      plane.fly(plane.airborne ? -interceptor.glide : 0, dt)
    },
  },
  /** It flies at its target and fires when it has it in its sights. */
  attack: {
    update: (plane, dt) => {
      plane.steerTo(plane.target, dt)
      if (plane.distance < interceptor.breakAway) plane.setState('extend')
      else if (plane.inSights) plane.fire()
    },
  },
  /** It pulls away the way it flies, to a point `reach` metres on, until far enough to turn and come again. */
  extend: {
    enter: plane => {
      plane.goal = plane.ahead(interceptor.reach * 1.5)
      plane.goal.y = plane.target.y + interceptor.floor
    },
    update: (plane, dt) => {
      plane.steerTo(plane.goal, dt)
      if (plane.distance > interceptor.reach) plane.setState('attack')
    },
  },
  /** A player flies it: it turns, banking, and climbs or dives as told, firing only when told. */
  flown: {
    update: (plane, dt) => {
      const { across, climb } = plane.command
      const step = interceptor.turn * dt
      plane.yaw -= across * step
      plane.pitch += Math.max(-step, Math.min(step, climb * interceptor.climb - plane.pitch))
      plane.roll += (-across - plane.roll) * Math.min(1, dt * 3)
      plane.cruise()
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
    /** What a player tells it, each from -1 to 1: right or left, and up or down. */
    this.command = { across: 0, climb: 0 }
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
    this.cruise()
  }

  /** Flies at its speed along its nose. */
  cruise() {
    const level = Math.cos(this.pitch) * this.speed
    this.vx = Math.cos(this.yaw) * level
    this.vy = Math.sin(this.pitch) * this.speed
    this.vz = -Math.sin(this.yaw) * level
  }

  /** A player's `across` and `climb`, each from -1 to 1, take it over from what it was doing, as the game's keys do. */
  steer({ across, climb }) {
    this.command = { across, climb }
    if ((across || climb) && this.state !== 'flown') this.setState('flown')
  }

  /** Flies on its heading, its nose easing to `pitch` and its wings to level. */
  fly(pitch, dt) {
    const step = interceptor.turn * dt
    this.pitch += Math.max(-step, Math.min(step, pitch - this.pitch))
    this.roll -= this.roll * Math.min(1, dt * 3)
    this.cruise()
  }

  /** Set to land, it comes down and rolls to a stop. */
  get landing() {
    return this.state === 'land'
  }

  /** Landing or shot down, it does not take off again; a landing plane can still be shot down. */
  setState(name) {
    if (name === 'dead' || (this.alive && !this.landing)) super.setState(name)
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
    if ((this.dead || this.landing) && !this.airborne) {
      if (this.dead) this.vx = this.vz = 0
      else this.pitch = 0
      this.vy = 0
      this.y = this.groundAt(this.x, this.z) + this.size.height / 2
    }
    this.rounds.update(dt, [this.target])
  }
}
