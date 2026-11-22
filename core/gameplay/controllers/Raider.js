/**
 * How far ahead of the target a raider heads, as a share of the view's width, and the least it keeps heading up the
 * river, in metres, so it never turns back once the target has passed that point.
 */
export const raid = { ahead: .5, onward: 1 }

/**
 * A boat's raid, seen from above: it heads along its lane for a point ahead of the target, firing at the target while
 * it lives and the boat `sees(target)`, and fights on until it sinks; it never turns back down the river, away from
 * the target. The body has `x`, `z`,
 * `lane` (the z it sails at), `course`, `aimAt(point)` and the states `move` and `attack`; `viewWidth()` gives the
 * width of the view in metres.
 */
export default class Raider {
  constructor(body, target, { viewWidth, sees }) {
    Object.assign(this, { body, target, viewWidth, sees })
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    const ahead = Math.min(target.x + this.viewWidth() * raid.ahead - body.x, -raid.onward)
    body.course = Math.atan2(-(body.lane - body.z), ahead)
    body.setState(target.alive && this.sees(target) ? 'attack' : 'move')
    body.aimAt(target)
  }
}
