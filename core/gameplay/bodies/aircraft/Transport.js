import Body from '../Body.js'

/**
 * The Ju 52 of the drop: about 180 km/h over the drop zone, in metres a second, and its length, height and span in
 * metres.
 */
export const transport = { speed: 50, size: { length: 18.9, height: 4.5, width: 29.25 } }

/**
 * A transport plane flying straight and level the way its `yaw` points. Over the drop zone, from `drop.from` to
 * `drop.to` metres along its way, its `jumpers` leave it one after another, evenly spaced; each time `jumped` grows,
 * the scene sends one more down from where the plane is.
 */
export default class Transport extends Body {
  constructor({ speed = transport.speed, jumpers = 0, drop = { from: 0, to: 0 }, size = transport.size, ...rest } = {}) {
    super({ size, ...rest })
    Object.assign(this, { speed, jumpers, drop })
    /** Metres flown since it was made. */
    this.travelled = 0
    this.jumped = 0
  }

  update(dt) {
    this.vx = Math.cos(this.yaw) * this.speed
    this.vz = -Math.sin(this.yaw) * this.speed
    super.update(dt)
    this.travelled += this.speed * dt
    const { from, to } = this.drop
    if (!this.jumpers || this.travelled < from) return
    const spacing = this.jumpers > 1 ? (to - from) / (this.jumpers - 1) : Infinity
    this.jumped = Math.min(this.jumpers, Math.floor((this.travelled - from) / spacing) + 1)
  }
}
