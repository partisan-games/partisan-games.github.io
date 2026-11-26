/** How much of a block's side a way may touch without going through it, in metres. */
const graze = 1e-3
/** The metres round the start and the end within which a way is sought first, wider each time none is found there. */
const searches = [30, 90, Infinity]

/** Whether the straight way from `a` to `b` `{ x, z }` goes through `block` `{ min, max }`, not only along its side. */
function crosses(a, b, { min, max }) {
  let start = 0, end = 1
  for (const axis of ['x', 'z']) {
    const step = b[axis] - a[axis], low = min[axis] + graze, high = max[axis] - graze
    if (Math.abs(step) < 1e-12) {
      if (a[axis] <= low || a[axis] >= high) return false
      continue
    }
    const enter = (low - a[axis]) / step, leave = (high - a[axis]) / step
    start = Math.max(start, Math.min(enter, leave))
    end = Math.min(end, Math.max(enter, leave))
    if (start >= end) return false
  }
  return true
}

const inside = (point, { min, max }) =>
  point.x > min.x + graze && point.x < max.x - graze && point.z > min.z + graze && point.z < max.z - graze

const length = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/**
 * The ways of men on foot round the `blocks` of a town, as its houses, each `{ min: { x, z }, max: { x, z } }`: they
 * keep `margin` metres off every wall and turn only at the corners of that margin.
 */
export default class Streets {
  constructor(blocks, margin = .6) {
    this.blocks = blocks.map(({ min, max }) => ({
      min: { x: min.x - margin, z: min.z - margin }, max: { x: max.x + margin, z: max.z + margin },
    }))
  }

  /** Whether the straight way from `a` to `b` goes round every one of `blocks`. */
  clear(a, b, blocks = this.blocks) {
    return !blocks.some(block => crosses(a, b, block))
  }

  /**
   * The corners to run by, in order, on the shortest way from `from` to `to` that keeps near them; none when the way
   * is straight. A block either end stands in, as the yard a man came down in, does not stop him. Gives null when no
   * way leads there.
   */
  route(from, to) {
    const open = this.blocks.filter(block => !inside(from, block) && !inside(to, block))
    if (this.clear(from, to, open)) return []
    for (const reach of searches) {
      const area = { min: { x: Math.min(from.x, to.x) - reach, z: Math.min(from.z, to.z) - reach },
        max: { x: Math.max(from.x, to.x) + reach, z: Math.max(from.z, to.z) + reach } }
      const blocks = open.filter(({ min, max }) =>
        min.x < area.max.x && max.x > area.min.x && min.z < area.max.z && max.z > area.min.z)
      const via = this.shortest(from, to, blocks)
      if (via) return via
    }
    return null
  }

  /** Dijkstra over the corners of `blocks`, the only ones that can stand in a way between them. */
  shortest(from, to, blocks) {
    const corners = blocks
      .flatMap(({ min, max }) => [{ x: min.x, z: min.z }, { x: max.x, z: min.z }, { x: min.x, z: max.z }, { x: max.x, z: max.z }])
      .filter(corner => !blocks.some(block => inside(corner, block)))
    const distance = corners.map(corner => this.clear(from, corner, blocks) ? length(from, corner) : Infinity)
    const previous = corners.map(() => null), done = corners.map(() => false)
    let best = Infinity, last = null
    for (;;) {
      let next = -1
      for (let i = 0; i < corners.length; i++)
        if (!done[i] && distance[i] < Infinity && (next < 0 || distance[i] < distance[next])) next = i
      if (next < 0 || distance[next] >= best) break
      done[next] = true
      const corner = corners[next]
      if (distance[next] + length(corner, to) < best && this.clear(corner, to, blocks)) {
        best = distance[next] + length(corner, to)
        last = next
      }
      for (let i = 0; i < corners.length; i++) {
        const through = distance[next] + length(corner, corners[i])
        if (done[i] || through >= distance[i] || through >= best || !this.clear(corner, corners[i], blocks)) continue
        distance[i] = through
        previous[i] = next
      }
    }
    if (last === null) return null
    const via = []
    for (let i = last; i !== null; i = previous[i]) via.unshift(corners[i])
    return via
  }
}
