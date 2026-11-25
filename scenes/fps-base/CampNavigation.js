const step = 2.5
const key = ({ x, z }) => `${x},${z}`
const directions = [[step, 0], [0, step], [-step, 0], [0, -step]]

/** Scene-owned routes through the actual colliders, shared by all companions. */
export default class CampNavigation {
  constructor(isBlocked, clearanceHeights = [.75, 1]) {
    this.isBlocked = isBlocked
    this.clearanceHeights = clearanceHeights
    this.edges = new Map()
  }

  clear(from, to) {
    const dx = to.x - from.x, dz = to.z - from.z
    const distance = Math.hypot(dx, dz)
    // Check every prisoner's standing origin as well as his current posture and crouching feet.
    const heights = Number.isFinite(from.y) ? [from.y, ...this.clearanceHeights] : this.clearanceHeights
    return distance < .01 || heights.every(y => !this.isBlocked({ x: from.x, y, z: from.z },
      { x: dx, y: 0, z: dz }, distance + .35))
  }

  nearest(point) {
    const x = Math.round(point.x / step) * step, z = Math.round(point.z / step) * step
    const candidates = [{ x, z }, ...directions.map(([dx, dz]) => ({ x: x + dx, z: z + dz }))]
    return candidates.filter(node => Math.abs(node.x) <= 37.5 && node.z >= -37.5 && node.z <= 45)
      .sort((a, b) => Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z))
      .find(node => this.clear(point, node))
  }

  neighbors(node) {
    const id = key(node)
    if (!this.edges.has(id)) this.edges.set(id, directions.map(([dx, dz]) => ({ x: node.x + dx, z: node.z + dz }))
      .filter(next => Math.abs(next.x) <= 37.5 && next.z >= -37.5 && next.z <= 45 && this.clear(node, next)))
    return this.edges.get(id)
  }

  route(from, to) {
    if (this.clear(from, to)) return [{ x: to.x, z: to.z }]
    const start = this.nearest(from), goal = this.nearest(to)
    if (!start || !goal) return []
    const pending = [{ ...start, previous: null }], visited = new Set([key(start)])
    for (let index = 0; index < pending.length; index++) {
      const node = pending[index]
      if (key(node) === key(goal)) {
        const route = [{ x: to.x, z: to.z }]
        for (let point = node; point; point = point.previous) route.push({ x: point.x, z: point.z })
        return route.reverse()
      }
      for (const next of this.neighbors(node)) {
        if (visited.has(key(next))) continue
        visited.add(key(next))
        pending.push({ ...next, previous: node })
      }
    }
    return []
  }
}
