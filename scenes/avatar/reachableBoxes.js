/** Height the feet must clear above a top, and distance they must reach past its edge, to land on it. */
const clearance = .3, foothold = 1

/**
 * The arc of a running jump held as long as it lifts, by the body `makeBody(groundAt)` gives on that ground: how far
 * the body has gone and how high above its take-off, sample by sample, rising and then falling well below it.
 */
export function jumpArc(makeBody, { dt = 1 / 60, seconds = 6 } = {}) {
  let floor = 0
  const body = makeBody(() => floor)
  body.steer({ ahead: 1, running: true })
  for (let t = 0; t < 1; t += dt) body.update(dt)
  const start = { x: body.x, z: body.z, feet: body.feet }
  const arc = []
  for (let t = 0; t < seconds; t += dt) {
    body.jump(dt)
    body.update(dt)
    floor = -Infinity
    arc.push({ distance: Math.hypot(body.x - start.x, body.z - start.z), height: body.feet - start.feet })
  }
  return arc
}

/** The `boxes` (Box3) a player jumping along `arc` can land on, from the ground at 0 or from another such box. */
export function reachableBoxes(boxes, arc) {
  // past its top the arc only falls, so the farthest point still at least `rise` above the take-off is found by halving
  const apex = arc.reduce((top, point, i) => point.height > arc[top].height ? i : top, 0)
  const farthest = rise => {
    if (rise > arc[apex].height) return -Infinity
    let low = apex, high = arc.length - 1
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (arc[middle].height >= rise) low = middle
      else high = middle - 1
    }
    return arc[low].distance
  }
  const gap = (a, b) => Math.hypot(Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x),
    Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z))
  const reached = new Set(boxes.filter(box => farthest(box.max.y + clearance) >= 0))
  const queue = [...reached]
  while (queue.length) {
    const from = queue.shift()
    for (const box of boxes)
      if (!reached.has(box) && gap(from, box) + foothold <= farthest(box.max.y - from.max.y + clearance)) {
        reached.add(box)
        queue.push(box)
      }
  }
  return boxes.filter(box => reached.has(box))
}
