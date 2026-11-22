import { Box3, Quaternion, Ray, Vector3 } from 'three'

const localRay = new Ray(), end = new Vector3(), hit = new Vector3()
const inverse = new Quaternion(), bounds = new Box3()

/** Test a finite segment against the current masonry, including fallen blocks and roof fragments. */
export function clearFortPath(from, to, stones, clearance = 0) {
  for (const stone of stones) {
    const { geometry } = stone
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    bounds.copy(geometry.boundingBox).expandByScalar(clearance)
    inverse.copy(stone.quaternion).invert()
    localRay.origin.copy(from).sub(stone.position).applyQuaternion(inverse)
    end.copy(to).sub(stone.position).applyQuaternion(inverse)
    if (bounds.containsPoint(localRay.origin) || bounds.containsPoint(end)) return false
    localRay.direction.subVectors(end, localRay.origin).normalize()
    if (localRay.intersectBox(bounds, hit) && hit.distanceToSquared(localRay.origin) <= end.distanceToSquared(localRay.origin))
      return false
  }
  return true
}
