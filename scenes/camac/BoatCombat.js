import { segmentBoxEntry } from '/core/collision/sweep.js'
import { toLocal } from '/core/collision/shapes.js'

/**
 * Sweep a bullet through a moving target's turned rectangle, widened by the bullet's own rectangle;
 * touching an edge counts. Seen from the target, the bullet starts where the target was.
 */
function hitTime(shot, target, before) {
  const angle = target.angle || 0
  const { start, end } = shot.path
  const from = toLocal(start, { x: before.x, y: before.y, angle })
  const to = toLocal(end, { x: target.x, y: target.y, angle })
  const direction = shot.angle - angle
  const paddingX = (Math.abs(Math.cos(direction)) * shot.width + Math.abs(Math.sin(direction)) * shot.height) / 2
  const paddingY = (Math.abs(Math.sin(direction)) * shot.width + Math.abs(Math.cos(direction)) * shot.height) / 2
  return segmentBoxEntry(from, to, target.width / 2 + paddingX, target.height / 2 + paddingY, { touch: true })
}

/** One hit phase after all actors and projectiles have moved. */
export default class BoatCombat {
  constructor(session, onHit = () => {}) {
    this.session = session
    this.onHit = onHit
    this.actors = new Map()
    this.before = new Map()
  }

  add(actor, team) {
    this.actors.set(actor, team)
  }
  remove(actor) {
    this.actors.delete(actor); this.before.delete(actor)
  }

  beginFrame() {
    this.before.clear()
    for (const actor of this.actors.keys())
      if (actor.alive && actor.visible)
        this.before.set(actor, { x: actor.x, y: actor.y, lifeId: actor.lifeId })

  }

  resolve() {
    if (this.session.state !== 'running') return
    for (const [owner, team] of this.actors)
      for (const shot of owner.bullets?.projectiles || []) {
        if (!shot.visible || !shot.path) continue
        let first = null
        for (const [target, targetTeam] of this.actors) {
          const before = this.before.get(target)
          if (targetTeam === team || !before || target.dead || !target.visible || before.lifeId !== target.lifeId ||
            !Number.isFinite(target.width) || !Number.isFinite(target.height)) continue
          const time = hitTime(shot, target, before)
          if (time !== null && (!first || time < first.time)) first = { target, time, lifeId: before.lifeId }
        }
        if (first) {
          const { target, time, lifeId } = first
          const { start, end } = shot.path
          shot.setPosition(start.x + (end.x - start.x) * time, start.y + (end.y - start.y) * time)
          const { x, y } = shot
          shot.reset()
          if (target.takeHit(shot.damage, lifeId)) this.onHit(x, y, target)
        } else if (shot.offScreen) shot.reset()
        shot.path = null
      }

  }
}
