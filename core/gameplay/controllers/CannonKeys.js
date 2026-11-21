/**
 * A player's keys on a field gun: holding fire charges the shot and letting it go fires it; up and down raise and
 * lower the barrel. `keyboard` has `isDown(key)`; `keys` has `shoot`, `up` and `down`. The body has `charge(dt)`,
 * `charged`, `launch()` and `turnBarrel(way, dt)`.
 */
export default class CannonKeys {
  constructor(body, { keyboard, keys }) {
    this.body = body
    this.keyboard = keyboard
    this.keys = keys
  }

  handleInput(dt) {
    const { body, keys, keyboard } = this
    if (keyboard.isDown(keys.shoot)) body.charge(dt)
    else if (body.charged) body.launch()

    if (keyboard.isDown(keys.up)) body.turnBarrel(1, dt)
    if (keyboard.isDown(keys.down)) body.turnBarrel(-1, dt)
  }
}
