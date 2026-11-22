/**
 * Where a bomb let go level from the body's height, falling at `gravity`, meets the target moving on: as far ahead of
 * it as the target goes while the bomb falls.
 */
export const dropLead = gravity => (target, body) => {
  const time = Math.sqrt(2 * Math.max(0, body.y - target.y) / gravity)
  return { x: target.x + target.vx * time, y: target.y }
}

/**
 * A dive bomber's run: while the target lives and the bomber `sees(target)` and can dive on it, the body is set to fire,
 * which dives on it and drops its bomb; otherwise it flies on. The body has `alive`, `aimAt(point)` and the states
 * `idle` and `attack`. It dives on the target itself, or where `aim(target, body)` gives, such as `lead` of `Gunner` or
 * `dropLead`.
 */
export default class Bombardier {
  constructor(body, target, { sees, aim = target => target }) {
    this.body = body
    this.target = target
    this.sees = sees
    this.aim = aim
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    body.setState(target.alive && this.sees(target) && body.aimAt(this.aim(target, body)) ? 'attack' : 'idle')
  }
}
