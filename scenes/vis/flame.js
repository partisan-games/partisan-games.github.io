/** A new fire must not reveal world-space particles left by an earlier life. */
export function resetFlame(plane) {
  if (!plane.flame) return
  plane.flame.sparks.length = 0
  plane.flame.x = plane.x
  plane.flame.y = plane.y
}
