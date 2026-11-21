import { Raycaster, Vector3 } from 'three'
import { getIntersects } from '/core3d/helpers.js'

/** How high above a point the ground is looked for. */
const above = 200

/**
 * The answers a character's body asks of a 3D world, found by rays through `solids`, the meshes that block: the
 * ground's height under a point, whether a step is blocked, how far a blow goes before a wall stops it, and whether
 * one body sees another. `impactAt` gives the view the surface a bullet marks; it is not a body query.
 * The scene may add to `solids` later.
 */
export default function worldQueries(solids) {
  // a mesh placed but not drawn yet has no world matrix, so a ray would find it where it was made
  for (const solid of [solids].flat()) solid.updateMatrixWorld(true)
  const raycaster = new Raycaster()
  const first = (from, direction, far) => {
    raycaster.set(new Vector3(from.x, from.y, from.z), new Vector3(direction.x, direction.y, direction.z).normalize())
    raycaster.far = far
    return getIntersects(raycaster, solids)[0]
  }
  return {
    impactAt: first,
    groundAt: (x, z) => first({ x, y: above, z }, { x: 0, y: -1, z: 0 }, Infinity)?.point.y ?? 0,
    isBlocked: (from, direction, distance) => Boolean(first(from, direction, distance)),
    obstacleAt: (from, direction, reach) => first(from, direction, reach)?.distance ?? Infinity,
    sees: (from, to) => {
      const way = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }
      const distance = Math.hypot(way.x, way.y, way.z)
      return distance === 0 || !first(from, way, distance)
    },
  }
}
