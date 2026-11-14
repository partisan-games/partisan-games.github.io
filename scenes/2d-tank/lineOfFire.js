/** First rectangle crossed by a projectile, including the space between frames. */
export function firstHit(start, end, targets, padding = { x: 0, y: 0 }) {
  let first = null
  for (const target of targets) {
    if (target.dead || !target.vidljiv || !Number.isFinite(target.sirina) || !Number.isFinite(target.visina)) continue
    let enter = 0
    let exit = 1
    for (const [axis, size] of [['x', 'sirina'], ['y', 'visina']]) {
      const half = target[size] / 2 + padding[axis]
      const near = target[axis] - half
      const far = target[axis] + half
      const delta = end[axis] - start[axis]
      if (delta === 0) {
        if (start[axis] < near || start[axis] > far) exit = -1
      } else {
        const a = (near - start[axis]) / delta
        const b = (far - start[axis]) / delta
        enter = Math.max(enter, Math.min(a, b))
        exit = Math.min(exit, Math.max(a, b))
      }
    }
    if (enter <= exit && (!first || enter < first.time)) first = { target, time: enter }
  }
  return first
}
