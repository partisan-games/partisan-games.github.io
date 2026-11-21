/**
 * When the step from `start` to `end` first enters the hit box of `target`, `size` about its centre: `length` along
 * x, `height` along y and `width` along z; or null. Touching a face is no entry.
 */
function boxEntry({ start, end }, target) {
  let enter = 0, exit = 1
  const sizes = { x: target.size.length, y: target.size.height, z: target.size.width }
  for (const axis of ['x', 'y', 'z']) {
    const from = start[axis] - (target[axis] ?? 0), to = end[axis] - (target[axis] ?? 0)
    const half = sizes[axis] / 2, delta = to - from
    if (delta === 0) {
      if (Math.abs(from) >= half) return null
      continue
    }
    const a = (-half - from) / delta, b = (half - from) / delta
    enter = Math.max(enter, Math.min(a, b))
    exit = Math.min(exit, Math.max(a, b))
  }
  return enter < exit ? enter : null
}

/**
 * The first living one of `targets` that the step `path` ({ start, end }) of a round projectile of `radius` crossed,
 * with the share of the step where it touched: { target, time }, or null. A target is its hit box, `size` about its
 * centre, or, if it has one, its own `hitTime(start, end, radius)`, such as for a cannon whose barrel turns.
 */
export function firstHit(path, targets, radius = 0) {
  if (!path) return null
  let first = null
  for (const target of targets) {
    if (target.dead) continue
    const time = target.hitTime ? target.hitTime(path.start, path.end, radius) : boxEntry(path, target)
    if (time !== null && (!first || time < first.time)) first = { target, time }
  }
  return first
}

/** The point a `fraction` of the way along `path`. */
export const along = ({ start, end }, fraction) => ({
  x: start.x + (end.x - start.x) * fraction,
  y: start.y + (end.y - start.y) * fraction,
  z: start.z + (end.z - start.z) * fraction,
})

/**
 * When the step `path` first enters the hull of `body` seen from above: its `size.length` along its heading `yaw` and
 * its `size.width` across it, in the x–z plane; or null. Touching a side is no entry.
 */
export function hullEntry({ start, end }, body) {
  const cos = Math.cos(body.yaw), sin = Math.sin(body.yaw)
  // along the heading (cos, -sin) and across it (sin, cos), from the body's middle
  const local = point => {
    const dx = point.x - body.x, dz = point.z - body.z
    return { x: dx * cos - dz * sin, y: dx * sin + dz * cos }
  }
  const from = local(start), to = local(end)
  let enter = 0, exit = 1
  for (const [axis, half] of [['x', body.size.length / 2], ['y', body.size.width / 2]]) {
    const delta = to[axis] - from[axis]
    if (delta === 0) {
      if (Math.abs(from[axis]) >= half) return null
      continue
    }
    const a = (-half - from[axis]) / delta, b = (half - from[axis]) / delta
    enter = Math.max(enter, Math.min(a, b))
    exit = Math.min(exit, Math.max(a, b))
  }
  return enter < exit ? enter : null
}
