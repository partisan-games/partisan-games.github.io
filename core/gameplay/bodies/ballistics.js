/**
 * The low arc's angle above level that throws a shot at `speed` from `origin` to `target` under `gravity`, in metres
 * with +y up, or null when no throw at that speed gets there.
 */
export function lowArc(origin, target, speed, gravity) {
  const distance = Math.abs(target.x - origin.x)
  if (distance < .01) return null
  const rise = target.y - origin.y
  const square = speed * speed
  const discriminant = square * square - gravity * (gravity * distance * distance + 2 * rise * square)
  if (discriminant < 0) return null
  return Math.atan((square - Math.sqrt(discriminant)) / (gravity * distance))
}
