import { Capsule } from 'three/examples/jsm/math/Capsule.js'
import { Octree } from 'three/examples/jsm/math/Octree.js'

/**
 * Slides a character along static walls. The capsule lies across its wings and follows its facing.
 */
export default function wallBlocker(walls, { widthScale = 1 } = {}) {
  const tree = new Octree().fromGraphNode(walls)
  const wings = new Capsule()
  return (body, previousX, previousZ) => {
    const { length } = body.size
    const width = body.size.width * widthScale
    wings.radius = Math.min(width, length) / 2
    const halfAxis = Math.abs(width - length) / 2
    const angle = width >= length ? body.yaw - Math.PI / 2 : body.yaw
    const ax = halfAxis * Math.cos(angle), az = -halfAxis * Math.sin(angle)
    const dx = body.x - previousX, dz = body.z - previousZ
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / wings.radius))
    let x = previousX, z = previousZ
    for (let i = 0; i < steps; i++) {
      x += dx / steps
      z += dz / steps
      wings.start.set(x - ax, body.y, z - az)
      wings.end.set(x + ax, body.y, z + az)
      const hit = tree.capsuleIntersect(wings)
      if (hit) {
        x += hit.normal.x * hit.depth
        z += hit.normal.z * hit.depth
      }
    }
    return { x, z }
  }
}
