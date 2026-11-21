/**
 * A player's keys on a tank: left and right drive it, up and down raise and lower the barrel, and letting go of fire
 * shoots. `keyboard` has `isDown(key)`; `keys` has `left`, `right`, `up`, `down` and `shoot`. The body has
 * `drive(way, dt)`, `raiseBarrel(dt)`, `lowerBarrel(dt)` and `shoot()`, and keeps itself on its ground.
 */
export default class TankKeys {
  constructor(body, { keyboard, keys }) {
    this.body = body
    this.keyboard = keyboard
    this.keys = keys
    this.fireHeld = false
  }

  handleInput(dt) {
    const { body, keys, keyboard } = this
    if (keyboard.isDown(keys.left)) body.drive(-1, dt)
    if (keyboard.isDown(keys.right)) body.drive(1, dt)
    if (keyboard.isDown(keys.up)) body.raiseBarrel(dt)
    if (keyboard.isDown(keys.down)) body.lowerBarrel(dt)

    if (keyboard.isDown(keys.shoot)) this.fireHeld = true
    else if (this.fireHeld) {
      body.shoot()
      this.fireHeld = false
    }
  }
}
