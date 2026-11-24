import Body from '../Body.js'

/**
 * A German paratrooper's round canopy, as the RZ 20 of 1944, sank about `descent` metres a second; the man under it is
 * the hit box, as big as a soldier on foot, so a shot through the canopy does not hurt him.
 */
export const parachutist = { descent: 5.5, size: { length: .5, height: 1.8, width: .5 } }

const states = { descend: {}, landed: {}, dead: {} }

/**
 * A soldier hanging under his parachute: he sinks `descent` metres a second, drifting with the wind's `drift`
 * `{ x, z }` metres a second, until his feet reach `groundAt(x, z)`; then he has `landed`, and the scene sends him on
 * as a soldier on foot. Shot dead in the air, he still sinks under his canopy and lies where he lands.
 */
export default class Parachutist extends Body {
  constructor({ descent = parachutist.descent, drift = { x: 0, z: 0 }, groundAt = () => 0, size = parachutist.size, ...rest } = {}) {
    super({ size, ...rest, states })
    Object.assign(this, { descent, drift, groundAt })
    this.vx = drift.x
    this.vy = -descent
    this.vz = drift.z
  }

  get landed() {
    return this.state === 'landed'
  }

  get feet() {
    return this.y - this.size.height / 2
  }

  update(dt) {
    super.update(dt)
    if (this.landed) return
    const ground = this.groundAt(this.x, this.z)
    if (this.feet > ground) return
    this.y = ground + this.size.height / 2
    this.vx = this.vy = this.vz = 0
    if (this.alive) this.setState('landed')
  }
}
