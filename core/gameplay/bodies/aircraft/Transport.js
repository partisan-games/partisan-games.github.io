import Body from '../Body.js'
import { modelStatistics } from '../../modelStatistics.js'

/**
 * The Ju 52 of the drop: about 180 km/h over the drop zone, in metres a second, and its length, height and span in
 * metres.
 */
export const transport = { speed: 50, size: { length: 18.9, height: 5.8, width: 29.25 } }

const states = { idle: {}, move: {}, dead: {} }

/**
 * A transport plane flying straight and level the way its `yaw` points. Over the drop zone, from `drop.from` to
 * `drop.to` metres along its way, its `jumpers` leave it one after another, evenly spaced; each time `jumped` grows,
 * the scene sends one more down from where the plane is.
 */
export default class Transport extends Body {
  constructor({ speed = transport.speed, jumpers = 0, drop = { from: 0, to: 0 }, size = transport.size,
    groundAt = () => 0, initial = 'move', ...rest } = {}) {
    super({ size, ...rest, states, initial })
    Object.assign(this, { speed, jumpers, drop, groundAt })
    this.physical = modelStatistics['ju-52']
    this.roll = 0
    /** Metres flown since it was made. */
    this.travelled = 0
    this.jumped = 0
  }

  get airborne() {
    return this.y > this.groundAt(this.x, this.z) + this.size.height / 2
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  update(dt) {
    if (this.dead) {
      if (this.airborne) {
        this.vy -= this.gravity * dt
        this.pitch = Math.max(-.5, this.pitch - dt * .15)
        this.roll = Math.min(.6, this.roll + dt * .2)
      } else this.vx = this.vy = this.vz = 0
      super.update(dt)
      const floor = this.groundAt(this.x, this.z) + this.size.height / 2
      if (this.y <= floor) {
        this.y = floor
        this.vx = this.vy = this.vz = 0
        this.pitch = this.roll = 0
      }
      return
    }
    if (this.state === 'idle') {
      this.vx = this.vy = this.vz = 0
      super.update(dt)
      return
    }
    this.vx = Math.cos(this.yaw) * this.speed
    this.vz = -Math.sin(this.yaw) * this.speed
    super.update(dt)
    this.travelled += this.speed * dt
    const { from, to } = this.drop
    if (!this.jumpers || this.travelled < from) return
    const spacing = this.jumpers > 1 ? (to - from) / (this.jumpers - 1) : Infinity
    this.jumped = to <= from ? this.jumpers : Math.min(this.jumpers, Math.floor((this.travelled - from) / spacing) + 1)
  }
}
