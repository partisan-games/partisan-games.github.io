import Body from '../Body.js'
import { firstHit, along } from './hits.js'

/** Seconds a bullet flies before it falls out of play where nothing says what is in sight, and the damage of a hit. */
export const bullet = { life: 1, damage: { min: 10, max: 20 } }

const states = {
  idle: {
    enter: bullet => {
      bullet.vx = bullet.vy = bullet.vz = 0
    },
  },
  flight: {
    update: bullet => {
      // a shooter's own velocity, added after the launch, turns the way it flies
      bullet.yaw = Math.atan2(-bullet.vz, bullet.vx)
      bullet.pitch = Math.atan2(bullet.vy, Math.hypot(bullet.vx, bullet.vz))
      if (bullet.stateTime >= bullet.life || bullet.view?.contains(bullet) === false) bullet.setState('idle')
    },
  },
}

/**
 * A bullet: out of play (`idle`) or flying straight on (`flight`) until it hits, leaves the `view`, the part of the
 * world in sight (`contains(point)`), or its `life` runs out: with a view, by default never. A hit takes the damage at
 * once. `damage` is the range a flight's damage is drawn from by `random`.
 */
export default class Bullet extends Body {
  constructor({ view = null, life = view ? Infinity : bullet.life, damage = bullet.damage, random = Math.random, ...rest } = {}) {
    super({ size: { length: .2, height: .2, width: .2 }, ...rest, states })
    Object.assign(this, { view, life, damageRange: damage, random })
    this.damage = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  /** Flies from `point` along `yaw` and `pitch`; a shooter adds its own velocity after. */
  launch(point, yaw, pitch, speed) {
    Object.assign(this, point)
    this.yaw = yaw
    this.pitch = pitch
    const level = Math.cos(pitch) * speed
    this.vx = Math.cos(yaw) * level
    this.vy = Math.sin(pitch) * speed
    this.vz = -Math.sin(yaw) * level
    const { min, max } = this.damageRange
    this.damage = min + this.random() * (max - min)
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

  firstHit(targets) {
    return firstHit(this.path, targets)
  }

  /** Stops where it entered the target, which takes its damage. */
  strike({ target, time }) {
    Object.assign(this, along(this.path, time))
    target.takeHit(this.damage)
    this.setState('idle')
  }
}
