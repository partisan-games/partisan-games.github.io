/**
 * A player's keys on a body seen from above that the arrows push across the view, such as a plane: holding fire fires
 * its guns, and each press of the special key drops a bomb, if it can. `input` has `left`, `right`, `up`, `down`,
 * `attack` and `special`. The body has `steer(x, z, dt)`, and may have `shoot()` and `dropBomb()`.
 */
export default class TopDownKeys {
  constructor(body, { input }) {
    this.body = body
    this.input = input
    this.held = { special: false }
  }

  handleInput(dt) {
    const { body, input, held } = this
    const x = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const z = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (x || z) body.steer(x, z, dt)
    if (input.attack) body.shoot?.()
    if (input.special && !held.special) body.dropBomb?.()
    held.special = Boolean(input.special)
  }
}
