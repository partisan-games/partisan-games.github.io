/**
 * How far along a ray from `origin` in the unit `direction` it enters a box, or null when it misses; a ray that
 * starts inside enters at 0. The box is a body's hit box: `x, y, z` its middle, `size` its length along its yaw,
 * its height and its width, turned `yaw` about +y with 0 facing +x.
 */
export function rayBoxEntry(origin, direction, { x, y, z, yaw = 0, size }) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw)
  // into the box's own axes: x ahead, y up, z to its right
  const local = (px, py, pz) => [px * cos - pz * sin, py, px * sin + pz * cos]
  const start = local(origin.x - x, origin.y - y, origin.z - z)
  const way = local(direction.x, direction.y, direction.z)
  const half = [size.length / 2, size.height / 2, size.width / 2]
  let near = 0, far = Infinity
  for (let axis = 0; axis < 3; axis++) {
    if (way[axis] === 0) {
      if (Math.abs(start[axis]) > half[axis]) return null
      continue
    }
    const a = (-half[axis] - start[axis]) / way[axis], b = (half[axis] - start[axis]) / way[axis]
    near = Math.max(near, Math.min(a, b))
    far = Math.min(far, Math.max(a, b))
    if (near > far) return null
  }
  return near
}
