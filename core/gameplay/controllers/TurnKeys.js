/**
 * A player's keys on a body that turns and goes the way it heads, seen from above, such as a boat or a crawling
 * soldier: up goes ahead, down back if the body can, left and right turn it, and holding fire fires if it has a gun.
 * `input` has `up`, `down`, `left`, `right` and `attack`. The body has `throttle(dt)` and `turn(way, dt)`, and may have
 * `back(dt)` and `shoot()`.
 */
export default class TurnKeys {
  constructor(body, { input }) {
    this.body = body
    this.input = input
  }

  handleInput(dt) {
    const { body, input } = this
    if (input.up) body.throttle(dt)
    if (input.down) body.back?.(dt)
    if (!input.up && !input.down) body.releaseThrottle?.()
    if (input.left) body.turn(-1, dt)
    if (input.right) body.turn(1, dt)
    if (input.attack) body.shoot?.()
  }
}
