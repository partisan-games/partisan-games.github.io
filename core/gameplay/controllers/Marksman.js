import { attackState } from '../bodies/stateNames.js'

/**
 * Keeps a body aimed at a target and fires while the target lives and the body `sees(target)`. Unlike `Gunner`, it
 * aims every frame, even at a target it may not fire at, and needs no reach: the body's `aimAt(point)` tells whether
 * it can fire there. The body has a state to attack in and the state it keeps while it holds fire, `rest`, such as
 * `idle` or `move`. It aims at the target itself, or where `aim(target, body)` gives, such as `lead` of `Gunner`.
 */
export default class Marksman {
  constructor(body, target, { rest = 'idle', sees, aim = target => target }) {
    this.body = body
    this.target = target
    this.rest = rest
    this.sees = sees
    this.aim = aim
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    const aimed = body.aimAt(this.aim(target, body))
    body.setState(aimed && target.alive && this.sees(target) ? attackState(body) : this.rest)
  }
}
