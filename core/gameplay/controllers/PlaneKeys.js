/**
 * A player's keys on a plane that flies on by itself: right and left throttle up and down, up and down climb and
 * dive, holding fire fires the gun and the observer's gun, and each press of the bomb key drops one bomb. `input` has
 * `left`, `right`, `up`, `down`, `attack` and `special` (the bomb button on a touch screen) and its `keyboard` has
 * `pressed`; `bombKey` is the key's code. The body has `speedUp(dt)`, `slowDown(dt)`, `climb(dt)`, `dive(dt)`,
 * `shoot()`, `fireBack()` and `dropBomb()`.
 */
export default class PlaneKeys {
  constructor(body, { input, bombKey }) {
    this.body = body
    this.input = input
    this.bombKey = bombKey
    this.bombHeld = false
  }

  handleInput(dt) {
    const { body, input } = this
    if (input.right) body.speedUp(dt)
    if (input.left) body.slowDown(dt)
    if (input.up) body.climb(dt)
    if (input.down) body.dive(dt)
    if (input.attack) {
      body.shoot()
      body.fireBack()
    }
    const bomb = Boolean(input.keyboard?.pressed[this.bombKey] || input.screen?.special)
    if (bomb && !this.bombHeld) body.dropBomb()
    this.bombHeld = bomb
  }
}
