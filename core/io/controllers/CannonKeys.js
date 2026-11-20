import { keyboard } from '../Keyboard.js'

/**
 * A player's keys on a cannon: holding fire charges the shot and letting it go fires it; up and down raise and lower
 * the barrel. The body has `charge(dt)`, `charged`, `launch()` and `turnBarrel(way, dt)`; `keys` has `shoot`, `up` and
 * `down`.
 */
export default class CannonKeys {
  constructor(body, keys) {
    this.body = body
    this.keys = keys
  }

  handleInput(dt) {
    const { body, keys } = this
    if (keyboard.isDown(keys.shoot)) body.charge(dt)
    else if (body.charged) body.launch()

    if (keyboard.isDown(keys.up)) body.turnBarrel(1, dt)
    if (keyboard.isDown(keys.down)) body.turnBarrel(-1, dt)
  }
}
