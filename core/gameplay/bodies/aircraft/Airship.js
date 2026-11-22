import Body from '../Body.js'

/**
 * Measured from the earlier airship at 30 frames a second: it turns `turn` and pitches `pitch` radians a second, no
 * more than `maxPitch` from level, and changes speed by `throttle` of its starting speed each second, between `min`
 * and `max` times it. Left alone, it levels out, losing `level` of its pitch each second. It keeps `clearance` metres
 * of air under it, and twice that once it moves.
 */
export const airship = { turn: .3, pitch: .06, maxPitch: .1, throttle: .3, min: .1, max: 2.5, level: 1 - .99 ** 30,
  clearance: 2 }

/** It is always under way; its engines never stop in the air. */
const states = { move: {}, dead: {} }

/**
 * An airship, seen whole from any side. `x, y, z` is the middle of its hull; it heads along `yaw` and noses up by
 * `pitch`, and flies on that way at its `speed`. It is steered to turn, to climb or sink and to speed up or slow down;
 * left alone it levels out and keeps above the ground that `groundAt(x, z)` gives.
 */
export default class Airship extends Body {
  constructor({ speed = 1, groundAt = () => 0, size = { length: 4, height: 2, width: 2 }, ...rest } = {}) {
    super({ size, ...rest, states })
    Object.assign(this, { speed, groundAt, cruise: speed })
    this.steering = { turn: 0, climb: 0, throttle: 0 }
  }

  get feet() {
    return this.y - this.size.height / 2
  }

  setState(name) {
    if (this.alive || name === 'dead') super.setState(name)
  }

  get clearance() {
    return this.feet - this.groundAt(this.x, this.z)
  }

  get touchingGround() {
    return this.clearance < airship.clearance
  }

  get moving() {
    return this.speed > this.cruise * airship.min
  }

  /** Turns (1 left), climbs or sinks (1 up) and speeds up or slows down (1 faster) until steered again. */
  steer({ turn = 0, climb = 0, throttle = 0 } = {}) {
    Object.assign(this.steering, { turn, climb, throttle })
  }

  /** Rises at its speed with its nose going up, or sinks with its nose going down; on the ground it only brakes. */
  climb(way, dt) {
    if (way < 0 && this.touchingGround) {
      this.speed *= .5 ** (dt * 30)
      return
    }
    if (way > 0 && this.touchingGround) this.speed = this.cruise * airship.max * .5
    this.y += way * this.speed * dt
    this.pitch = Math.max(-airship.maxPitch, Math.min(airship.maxPitch, this.pitch + way * airship.pitch * dt))
  }

  update(dt) {
    if (this.dead) {
      this.speed = this.vx = this.vz = 0
      this.vy -= this.gravity * dt
      super.update(dt)
      if (this.clearance <= 0) {
        this.y = this.groundAt(this.x, this.z) + this.size.height / 2
        this.vy = this.pitch = 0
      } else this.pitch = Math.max(-.2, this.pitch - dt * .18)
      return
    }
    const { turn, climb, throttle } = this.steering
    this.yaw += turn * airship.turn * dt
    if (climb) this.climb(climb, dt)
    else if (this.moving && this.clearance < airship.clearance * 2) this.climb(1, dt)
    if (throttle > 0) {
      if (this.touchingGround) this.climb(1, dt)
      this.speed = Math.min(this.cruise * airship.max, this.speed + this.cruise * airship.throttle * dt)
    } else if (throttle < 0 && this.speed >= this.cruise * airship.min)
      this.speed -= this.cruise * airship.throttle * dt
    if (!turn && !climb && !throttle) this.pitch *= (1 - airship.level) ** dt
    const level = Math.cos(this.pitch) * this.speed
    this.vx = Math.cos(this.yaw) * level
    this.vy = Math.sin(this.pitch) * this.speed
    this.vz = -Math.sin(this.yaw) * level
    super.update(dt)
  }
}
