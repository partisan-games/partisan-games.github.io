import { toLocal } from './shapes.js'

/**
 * When a moving point first enters a box: the time in [0, 1] along the segment from start to end,
 * or null. Both points are in the box's frame, around its centre. Touching an edge is no entry,
 * unless `touch` says otherwise.
 */
export function segmentBoxEntry(start, end, halfWidth, halfHeight, { touch = false } = {}) {
  let enter = 0
  let exit = 1
  for (const [axis, half] of [['x', halfWidth], ['y', halfHeight]]) {
    const delta = end[axis] - start[axis]
    if (delta === 0) {
      const distance = Math.abs(start[axis])
      if (touch ? distance > half : distance >= half) return null
    } else {
      const a = (-half - start[axis]) / delta
      const b = (half - start[axis]) / delta
      enter = Math.max(enter, Math.min(a, b))
      exit = Math.min(exit, Math.max(a, b))
    }
  }
  return (touch ? enter <= exit : enter < exit) ? enter : null
}

/** When a moving point first comes closer than `radius` to `centre`, or null. */
function segmentCircleEntry(start, end, centre, radius) {
  const from = { x: start.x - centre.x, y: start.y - centre.y }
  const move = { x: end.x - start.x, y: end.y - start.y }
  const outside = from.x ** 2 + from.y ** 2 - radius ** 2
  if (outside < 0) return 0
  const a = move.x ** 2 + move.y ** 2
  const b = from.x * move.x + from.y * move.y
  const discriminant = b ** 2 - a * outside
  if (a === 0 || discriminant <= 0) return null
  const time = (-b - Math.sqrt(discriminant)) / a
  return time >= 0 && time < 1 ? time : null
}

const earliest = times => times.reduce((first, time) => time !== null && (first === null || time < first) ? time : first, null)

/**
 * When a round projectile moving from start to end first touches a shape, or null.
 * Around a box it reaches as far as its radius, also around the corners, which stay round:
 * a box simply widened by the radius would count misses past its corners.
 */
export function sweepCircle(start, end, radius, shape) {
  if (shape.type === 'circle') return segmentCircleEntry(start, end, shape, shape.r + radius)

  const from = toLocal(start, shape)
  const to = toLocal(end, shape)
  const { halfWidth, halfHeight } = shape
  if (!radius) return segmentBoxEntry(from, to, halfWidth, halfHeight)
  return earliest([
    segmentBoxEntry(from, to, halfWidth + radius, halfHeight),
    segmentBoxEntry(from, to, halfWidth, halfHeight + radius),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) =>
      segmentCircleEntry(from, to, { x: x * halfWidth, y: y * halfHeight }, radius)),
  ])
}
