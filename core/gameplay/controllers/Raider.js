/**
 * How far ahead of the target a raider heads, as a share of the view's width; how many bursts it fires and how many
 * seconds it stays before it withdraws.
 */
export const raid = { ahead: .5, bursts: 2, seconds: 10 }

/**
 * A boat's raid: it heads along its lane for a point ahead of the target, firing at the target while it lives and is
 * in sight, and withdraws for good after its bursts or its time. The body has `x`, `y`, `lane` (the height it sails at),
 * `born` (when its pass began on `clock`), `bursts`, `course`, `aimAt(point)` and the states `sail`, `fire` and
 * `withdraw`; `view` has the `width` of the view.
 */
export default class Raider {
  constructor(body, target, { clock, view }) {
    this.body = body
    this.target = target
    this.clock = clock
    this.view = view
  }

  update() {
    const { body, target, view } = this
    if (!body.alive) return
    if (body.state === 'withdraw' || this.clock.now - body.born > raid.seconds || body.bursts >= raid.bursts)
      body.setState('withdraw')
    else {
      body.course = Math.atan2(body.lane - body.y, target.x + view.width * raid.ahead - body.x)
      body.setState(target.alive && target.shown ? 'fire' : 'sail')
    }
    body.aimAt(target)
  }
}
