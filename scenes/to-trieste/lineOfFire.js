import { segmentBoxEntry } from '/core/collision/sweep.js'

/** First rectangle crossed by a projectile, including the space between frames; touching an edge counts. */
export function firstHit(start, end, targets, padding = { x: 0, y: 0 }) {
  let first = null
  for (const target of targets) {
    if (target.dead || !target.visible || !Number.isFinite(target.width) || !Number.isFinite(target.height)) continue
    const time = segmentBoxEntry(
      { x: start.x - target.x, y: start.y - target.y },
      { x: end.x - target.x, y: end.y - target.y },
      target.width / 2 + padding.x, target.height / 2 + padding.y, { touch: true },
    )
    if (time !== null && (!first || time < first.time)) first = { target, time }
  }
  return first
}
