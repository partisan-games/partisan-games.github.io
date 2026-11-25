/**
 * Where a landed paratrooper goes to fight the stronghold at `target` `{ x, z }`: the nearest free one of the cover
 * `spots` `{ x, z, height, taken }` within `reach` metres, which he takes, `behind` metres beyond it as seen from the
 * stronghold, or, for a stretch of the stronghold's own wall, `behind` metres the way `out` `{ x, z }` of it faces;
 * the defenders look over that wall, so it is `overlooked`.
 * A cover farther from the stronghold than he already is would be a retreat, so it is none for him; without one he
 * fights from where he landed, and the result is null.
 */
export default function coverGoal(soldier, { spots, target, reach, behind }) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
  const ownDistance = distance(soldier, target)
  const [cover] = spots
    .filter(spot => !spot.taken && distance(spot, soldier) <= reach && distance(spot, target) < ownDistance)
    .sort((a, b) => distance(a, soldier) - distance(b, soldier))
  if (!cover) return null
  cover.taken = true
  const away = distance(cover, target)
  const out = cover.out ?? { x: (cover.x - target.x) / away, z: (cover.z - target.z) / away }
  const goal = { x: cover.x + out.x * behind, z: cover.z + out.z * behind, cover: cover.height }
  return cover.out ? { ...goal, overlooked: true } : goal
}
