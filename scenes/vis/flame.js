/** A new fire must not reveal world-space particles left by an earlier life. */
export function resetFlame(plane) {
  if (!plane.plamen) return
  plane.plamen.iskre.length = 0
  plane.plamen.x = plane.x
  plane.plamen.y = plane.y
}
