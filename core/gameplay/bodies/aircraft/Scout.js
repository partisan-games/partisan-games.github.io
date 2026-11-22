import Body from '../Body.js'
import { fall } from './wreck.js'

/**
 * A Fieseler Storch: its slow level speed in metres a second and its health in bullet damage, less than a fighter's.
 * Sized in the scale of the Kluz planes, from its 780 × 304 px picture.
 */
export const scout = { speed: 7.3, health: 25, size: { length: 7.2, height: 2.8, width: 7.2 } }

/** The spotter flies level where it is put; shot down, it falls and crashes. */
const states = {
  idle: { update: plane => plane.cruise() },
  move: { update: plane => plane.cruise() },
  dead: {},
}

/**
 * An unarmed spotter plane, facing right (yaw 0) or left (yaw π). Its wreck crashes on `groundAt(x)` and
 * `onCrash(point)` destroys what it hits.
 */
export default class Scout extends Body {
  constructor({ groundAt = () => 0, onCrash = () => {}, ...rest } = {}) {
    super({ size: scout.size, health: scout.health, ...rest, states })
    Object.assign(this, { groundAt, onCrash })
    this.crashed = false
  }

  /** The way it flies: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  face(way) {
    this.yaw = way < 0 ? Math.PI : 0
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  /** It flies level the way it faces. */
  cruise() {
    this.pitch = 0
    this.vx = this.forward * scout.speed
    this.vy = 0
  }

  /** A shot down Storch keeps flying on as it falls. */
  update(dt) {
    if (this.dead) fall(this, dt)
    super.update(dt)
  }
}
