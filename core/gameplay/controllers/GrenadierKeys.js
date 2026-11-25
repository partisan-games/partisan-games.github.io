import { grenadier } from '../bodies/soldiers/Grenadier.js'

/**
 * A player's keys on a grenadier seen from above: the arrows walk him across the view, and the attack key, held and
 * let go, throws his grenade the farther the longer it was held, at full strength after `grenadier.throw.charge`
 * seconds. `input` has `left`, `right`, `up`, `down` and `attack`.
 */
export default class GrenadierKeys {
  constructor(body, { input }) {
    this.body = body
    this.input = input
    /** How long the attack key has been held, or null while it is up. */
    this.held = null
  }

  handleInput(dt) {
    const { body, input } = this
    const x = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const z = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (x || z) body.steer(x, z, dt)
    if (input.attack) {
      this.held = this.held === null ? 0 : this.held + dt
      return
    }
    if (this.held === null) return
    body.shoot(this.held / grenadier.throw.charge)
    this.held = null
  }
}
