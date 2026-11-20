import { keyboard } from '../Keyboard.js'

/**
 * A player's keys on a tank: left and right drive it within its ground, up and down raise and lower the barrel, and
 * letting go of fire shoots. The body has `drive(way, dt)`, `minX`, `maxX`, `diziCev(dt)`, `spustajCev(dt)` and
 * `shoot()`; `keys` has `left`, `right`, `up`, `down` and `shoot`.
 */
export default class TankKeys {
  constructor(body, keys) {
    this.body = body
    this.keys = keys
    this.fireHeld = false
  }

  handleInput(dt) {
    const { body, keys } = this
    if (keyboard.isDown(keys.left) && body.x > body.minX) body.drive(-1, dt)
    if (keyboard.isDown(keys.right) && body.x < body.maxX) body.drive(1, dt)
    if (keyboard.isDown(keys.up)) body.diziCev(dt)
    if (keyboard.isDown(keys.down)) body.spustajCev(dt)

    if (keyboard.isDown(keys.shoot)) this.fireHeld = true
    else if (this.fireHeld) {
      body.shoot()
      this.fireHeld = false
    }
  }
}
