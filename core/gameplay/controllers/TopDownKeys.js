/**
 * A player's keys on a body seen from above that the arrows push across the view, such as a plane or a soldier on
 * foot: holding fire fires its guns, and each press of the second attack key loops it and of the special key drops a
 * bomb, if it can. `input` has `left`, `right`, `up`, `down`, `attack`, `attack2` and `special`. The body has
 * `steer(x, z, dt)`, and may have `shoot()`, `loop()` and `dropBomb()`.
 */
export default class TopDownKeys {
  constructor(body, { input }) {
    this.body = body
    this.input = input
    this.held = { attack2: false, special: false }
  }

  handleInput(dt) {
    const { body, input, held } = this
    const x = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const z = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (x || z) body.steer(x, z, dt)
    if (input.attack) body.shoot?.()
    if (input.attack2 && !held.attack2) body.loop?.()
    if (input.special && !held.special) body.dropBomb?.()
    held.attack2 = Boolean(input.attack2)
    held.special = Boolean(input.special)
  }
}
