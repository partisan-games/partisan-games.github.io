import Body from '../Body.js'
import { firstHit, along } from './hits.js'

/**
 * A round shot of an old field gun: its radius and fall in metres, the seconds its burst lasts before the target is
 * damaged, and the damage. Its fall is the game's own, a quarter of the Earth's, so that shots fly as in the earlier
 * pixel game (owner's choice, 2026-11-21).
 */
export const cannonball = { radius: .1, gravity: 2.45, burst: .15, damage: { min: 20, max: 30 } }

/** When a value moving evenly from `from` to `to` during a step first reaches `limit`, or null. */
function whenReaches(from, to, limit) {
  if (from >= limit) return 0
  return to >= limit ? (limit - from) / (to - from) : null
}

const earliest = (...times) => times.reduce((first, time) => time !== null && (first === null || time < first) ? time : first, null)

const states = {
  idle: {
    enter: ball => {
      ball.vx = ball.vy = ball.vz = 0
      ball.target = null
    },
  },
  flight: {
    update: (ball, dt) => {
      ball.vx += (ball.wind?.acceleration ?? 0) * dt
      ball.vy -= cannonball.gravity * dt
      ball.pitch = Math.atan2(ball.vy, Math.abs(ball.vx))
    },
  },
  burst: {
    enter: ball => {
      ball.vx = ball.vy = ball.vz = 0
    },
    update: ball => {
      if (ball.stateTime < cannonball.burst) return
      if (ball.target?.alive) ball.target.takeHit(ball.damage)
      ball.setState('idle')
    },
  },
}

/**
 * A cannonball: out of play (`idle`), flying under gravity and the `wind` (`acceleration` in metres a second squared,
 * along +x), or bursting (`burst`) on a target, which takes the damage when the burst ends, or on the ground. Whatever
 * a step reaches first ends the flight: a target, the ground `groundAt(x)`, which may have craters, or a side of
 * `bounds`, past which it leaves play without a burst. Each burst calls `onBlast(x)`, which digs a crater under it,
 * and `bursts` counts them for the view. A high arc may leave the top and come back.
 */
export default class Cannonball extends Body {
  constructor({ wind = null, groundAt = () => 0, bounds = { min: -Infinity, max: Infinity }, onBlast = () => {},
    random = Math.random, ...rest } = {}) {
    const diameter = cannonball.radius * 2
    super({ size: { length: diameter, height: diameter, width: diameter }, ...rest, states })
    Object.assign(this, { wind, groundAt, bounds, onBlast, random })
    this.target = null
    this.damage = 0
    this.bursts = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  launch(point, yaw, pitch, speed) {
    Object.assign(this, point)
    this.yaw = yaw
    this.pitch = pitch
    const level = Math.cos(pitch) * speed
    this.vx = Math.cos(yaw) * level
    this.vy = Math.sin(pitch) * speed
    this.vz = -Math.sin(yaw) * level
    const { min, max } = cannonball.damage
    this.damage = min + this.random() * (max - min)
    this.setState('idle')
    this.setState('flight')
  }

  /** Where the last step began, so whatever it reached first is found. */
  get path() {
    return this.from && { start: this.from, end: { x: this.x, y: this.y, z: this.z } }
  }

  update(dt) {
    this.from = this.state === 'flight' ? { x: this.x, y: this.y, z: this.z } : null
    super.update(dt)
  }

  /** When this step first touches the ground, found by halving the step, or null. */
  landingTime() {
    const { path } = this
    const below = time => {
      const { x, y } = along(path, time)
      return y - cannonball.radius <= this.groundAt(x)
    }
    if (below(0)) return 0
    if (!below(1)) return null
    let above = 0, under = 1
    for (let i = 0; i < 30; i++) {
      const middle = (above + under) / 2
      if (below(middle)) under = middle
      else above = middle
    }
    return under
  }

  /** When this step leaves the sides of `bounds` wholly, or null. */
  exitTime() {
    const { start, end } = this.path, r = cannonball.radius
    return earliest(
      whenReaches(-(start.x + r), -(end.x + r), -this.bounds.min),
      whenReaches(start.x - r, end.x - r, this.bounds.max),
    )
  }

  /** What this step reaches first: a living one of `targets`, the ground or a side, with the share of the step. */
  firstHit(targets) {
    if (!this.path) return null
    const hit = firstHit(this.path, targets, cannonball.radius)
    const landing = this.landingTime(), exit = this.exitTime()
    const time = earliest(hit?.time ?? null, landing, exit)
    if (time === null) return null
    if (time === hit?.time) return hit
    return { time, ground: time === landing }
  }

  /** Bursts where it reached a target or the ground, and digs a crater under it; past a side it only leaves play. */
  strike({ target = null, time, ground }) {
    if (!target && !ground) return this.setState('idle')
    Object.assign(this, along(this.path, time))
    this.setState('burst')
    this.target = target
    this.bursts++
    this.onBlast(this.x)
  }
}
