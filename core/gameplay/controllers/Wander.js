/** Seconds between two turns of a wandering body, and how far either side of +x it may head, in radians. */
export const wander = { turnTime: .3, spread: Math.PI / 4 }

/**
 * Wanders a body on: every while it heads a new random way, within `spread` of +x, as a patrol searching a wood does.
 * The body has `alive` and `head(yaw)`; `random` gives each new way.
 */
export default class Wander {
  constructor(body, { random = Math.random } = {}) {
    this.body = body
    this.random = random
    this.elapsed = 0
  }

  update(dt) {
    if (!this.body.alive) return
    this.elapsed += dt
    if (this.elapsed < wander.turnTime) return
    this.elapsed = 0
    this.body.head((this.random() * 2 - 1) * wander.spread)
  }
}
