/**
 * Keeps a body aimed at a target and fires while the target lives and is in sight. Unlike `Gunner`, it aims every
 * frame, even at a target it may not fire at, and needs no reach: the body's `aimAt(point)` tells whether it can fire
 * there. The body has the state `fire` and the state it keeps while it holds fire, `rest`, such as `idle` or `drive`.
 */
export default class Marksman {
  constructor(body, target, { rest = 'idle' } = {}) {
    this.body = body
    this.target = target
    this.rest = rest
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    const aimed = body.aimAt(target)
    body.setState(aimed && target.alive && target.shown ? 'fire' : this.rest)
  }
}
