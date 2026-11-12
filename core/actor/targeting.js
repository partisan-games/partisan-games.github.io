/** The closest living target to the given position; targeting does not fire or move anything. */
export const nearestTarget = (position, targets) => {
  let nearest = null
  let distance = Infinity
  for (const target of targets) {
    if (!target.alive) continue
    const next = Math.hypot(target.x - position.x, target.y - position.y)
    if (next < distance) {
      nearest = target
      distance = next
    }
  }
  return nearest
}
