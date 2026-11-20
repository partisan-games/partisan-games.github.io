/**
 * A dive bomber's run: while the target lives and is in sight, the body sights its bomb on it and is set to fire,
 * which drops the bomb as it passes over; otherwise it flies on. The body has `alive`, `aimAt(point)` and the states
 * `fly` and `fire`.
 */
export default class Bombardier {
  constructor(body, target) {
    this.body = body
    this.target = target
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    body.setState(target.alive && target.shown && body.aimAt(target) ? 'fire' : 'fly')
  }
}
