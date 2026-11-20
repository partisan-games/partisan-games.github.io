/**
 * Fires a body at a target: while the target lives, is within the body's `reach` and the body can aim at it, the body
 * fires; otherwise it holds fire. The body has `reach`, `aimAt(point)`, which gives whether it can fire there, and
 * the states `idle` and `fire`.
 */
export default class Gunner {
  constructor(body, target) {
    this.body = body
    this.target = target
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    const inReach = target.alive && Math.hypot(target.x - body.x, target.y - body.y) <= body.reach
    body.setState(inReach && body.aimAt(target) ? 'fire' : 'idle')
  }
}
