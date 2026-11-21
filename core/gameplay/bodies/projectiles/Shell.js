import Body from '../Body.js'
import { segmentBoxEntry } from '../../../collision/sweep.js'

/** Metres a second squared it falls, the seconds its burst lasts before the target is damaged, and the damage. */
export const shell = { gravity: 9.8, burst: .15, damage: { min: 10, max: 20 } }

const states = {
  idle: {
    enter: shell => {
      shell.vx = shell.vy = shell.vz = 0
      shell.target = null
    },
  },
  flight: {
    update: (shell, dt) => {
      shell.vy -= shell.gravity * dt
      shell.pitch = Math.atan2(shell.vy, Math.hypot(shell.vx, shell.vz))
      const { bounds } = shell
      const outside = bounds && (shell.x < bounds.min.x || shell.x > bounds.max.x || shell.y > bounds.max.y)
      if (shell.y < shell.groundAt(shell.x, shell.z) || outside) shell.setState('idle')
    },
  },
  burst: {
    enter: shell => {
      shell.vx = shell.vy = shell.vz = 0
    },
    update: shell => {
      if (shell.stateTime < shell.burst) return
      if (shell.target.alive) shell.target.takeHit(shell.damage)
      shell.setState('idle')
    },
  },
}

/**
 * A shell: out of play (`idle`), flying under gravity (`flight`), or bursting on a target (`burst`), which takes the
 * damage when the burst ends, unless it died meanwhile. It leaves play below `groundAt(x, z)` or outside `bounds`,
 * without a burst. `random` gives each flight its damage.
 */
export default class Shell extends Body {
  constructor({ gravity = shell.gravity, burst = shell.burst, groundAt = () => 0, bounds = null, random = Math.random, ...rest } = {}) {
    super({ size: { length: .3, height: .3, width: .3 }, ...rest, states })
    Object.assign(this, { gravity, burst, groundAt, bounds, random })
    this.target = null
    this.damage = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  launch(point, yaw, pitch, speed) {
    Object.assign(this, point)
    this.yaw = yaw
    const level = Math.cos(pitch) * speed
    this.vx = Math.cos(yaw) * level
    this.vy = Math.sin(pitch) * speed
    this.vz = -Math.sin(yaw) * level
    this.damage = shell.damage.min + this.random() * (shell.damage.max - shell.damage.min)
    this.setState('idle')
    this.setState('flight')
  }

  /** Where the last step began, so a hit anywhere along it is found. */
  get path() {
    return this.from && { start: this.from, end: { x: this.x, y: this.y, z: this.z } }
  }

  update(dt) {
    this.from = this.state === 'flight' ? { x: this.x, y: this.y, z: this.z } : null
    super.update(dt)
  }

  /** The first living one of `targets` this step crossed, with the share of the step where it entered. */
  firstHit(targets) {
    const { path } = this
    if (!path) return null
    let first = null
    for (const target of targets) {
      if (target.dead) continue
      const local = point => ({ x: point.x - target.x, y: point.y - target.y, z: point.z - (target.z ?? 0) })
      const start = local(path.start), end = local(path.end)
      const time = segmentBoxEntry(start, end, target.size.length / 2, target.size.height / 2)
      if (time === null || Math.abs(start.z + (end.z - start.z) * time) > target.size.width / 2) continue
      if (!first || time < first.time) first = { target, time }
    }
    return first
  }

  /** Bursts where it entered the target; the damage follows when the burst ends. */
  strike({ target, time }) {
    const { start, end } = this.path
    for (const axis of ['x', 'y', 'z']) this[axis] = start[axis] + (end[axis] - start[axis]) * time
    this.target = target
    this.setState('burst')
  }
}
