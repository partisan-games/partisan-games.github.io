/**
 * How far ahead of the target a raider heads, as a share of the view's width; how many bursts it fires and how many
 * seconds it stays before it withdraws.
 */
export const raid = { ahead: .5, bursts: 2, seconds: 10 }

/**
 * A boat's raid, seen from above: it heads along its lane for a point ahead of the target, firing at the target while
 * it lives and the boat `sees(target)`, and withdraws for good after its bursts or its time on the game `clock`. The
 * body has `x`, `z`, `lane` (the z it sails at), `born` (when its pass began), `bursts`, `course`, `aimAt(point)` and
 * the states `sail`, `fire` and `withdraw`; `viewWidth()` gives the width of the view in metres.
 */
export default class Raider {
  constructor(body, target, { clock, viewWidth, sees }) {
    Object.assign(this, { body, target, clock, viewWidth, sees })
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    if (body.state === 'withdraw' || this.clock.now - body.born > raid.seconds || body.bursts >= raid.bursts)
      body.setState('withdraw')
    else {
      body.course = Math.atan2(-(body.lane - body.z), target.x + this.viewWidth() * raid.ahead - body.x)
      body.setState(target.alive && this.sees(target) ? 'fire' : 'sail')
    }
    body.aimAt(target)
  }
}
