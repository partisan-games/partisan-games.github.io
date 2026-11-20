/**
 * How far ahead of the target, in pixels, a fighter starts its dive: nearer than `farthest` and than `farthestView`
 * of the view's width, farther than `nearest`; and how near it pulls up.
 */
export const strafe = { nearest: 160, farthest: 900, farthestView: .9, pullUp: 180 }

/**
 * A fighter's strafing pass: it flies level until the target is ahead within reach, dives once at it, firing while the
 * target lives and is in sight, and levels out when near it or as low as it dives, `pullUpY`. Each new life of the
 * plane is a new pass. The body has `x`, `y`, `alive`, `lifeId`, `pullUpY`, `aimAt(point)` and the states `fly`,
 * `dive` and `fire`; `viewWidth()` gives the width of the view.
 */
export default class Strafer {
  constructor(body, target, { viewWidth }) {
    this.body = body
    this.target = target
    this.viewWidth = viewWidth
    this.lifeId = null
    this.phase = 'approach'
  }

  update() {
    const { body, target } = this
    if (!body.alive) return
    if (body.lifeId !== this.lifeId) {
      this.lifeId = body.lifeId
      this.phase = 'approach'
    }
    const lead = body.x - target.x
    if (this.phase === 'approach' && lead > strafe.nearest && lead < Math.min(strafe.farthest, this.viewWidth() * strafe.farthestView)) {
      this.phase = 'dive'
      body.aimAt(target)
    }
    if (this.phase === 'dive' && (body.y >= body.pullUpY || lead <= strafe.pullUp)) this.phase = 'done'
    if (this.phase !== 'dive') body.setState('fly')
    else body.setState(target.alive && target.shown ? 'fire' : 'dive')
  }
}
