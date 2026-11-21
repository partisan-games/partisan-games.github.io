import { Box3, Vector3 } from 'three'

/**
 * A target for characters' bodies made of a mesh that is no body, as a physics tank or a first-person player: it is
 * where the mesh is, as big as the mesh was when made, and faces the way the mesh faces (-z, or +z with
 * `facesPositiveZ`). `takeHit(damage)` passes a blow on, and `alive()` tells whether it still counts.
 */
export default function meshTarget(mesh, { takeHit = () => false, alive = () => true, facesPositiveZ = false } = {}) {
  mesh.updateMatrixWorld(true)
  const box = new Box3().setFromObject(mesh)
  const { x: width, y: height, z: length } = box.getSize(new Vector3())
  const above = box.getCenter(new Vector3()).y - mesh.position.y
  const way = new Vector3()
  return {
    size: { length, height, width },
    get x() {
      return mesh.position.x
    },
    get y() {
      return mesh.position.y + above
    },
    get z() {
      return mesh.position.z
    },
    get feet() {
      return this.y - height / 2
    },
    get yaw() {
      mesh.getWorldDirection(way)
      if (!facesPositiveZ) way.negate()
      return Math.atan2(-way.z, way.x)
    },
    get alive() {
      return alive()
    },
    get dead() {
      return !alive()
    },
    takeHit,
  }
}
