/**
 * Where a shot at `speed` meets a target that flies on straight: the target's place after the shot's flight from the
 * body, for a gun whose shell is slow next to the target.
 */
export const lead = speed => (target, body) => {
  const time = Math.hypot(target.x - body.x, target.y - body.y) / speed
  return { x: target.x + target.vx * time, y: target.y + target.vy * time }
}

/**
 * Fires a body at a target: while the target lives, is within the body's `reach` and the body can aim at it, the body
 * fires; otherwise it holds fire. The body has `reach`, `aimAt(point)`, which gives whether it can fire there, and
 * the states `idle` and `attack`. It aims at the target itself, or where `aim(target, body)` gives, such as `lead`.
 */
export default class Gunner {
  constructor(body, target, aim = target => target) {
    this.body = body
    this.target = target
    this.aim = aim
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    const inReach = target.alive && Math.hypot(target.x - body.x, target.y - body.y) <= body.reach
    body.setState(inReach && body.aimAt(this.aim(target, body)) ? 'attack' : 'idle')
  }
}
