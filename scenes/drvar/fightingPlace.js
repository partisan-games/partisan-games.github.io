/**
 * Where a landed paratrooper goes to fight the stronghold at `target` `{ x, z }`, which he can fire at from `range`
 * metres. He takes the nearest free one of the cover `spots` `{ x, z, height, taken }` within `reach` metres of him,
 * in range and `inSight(spot)` of the stronghold, `behind` metres beyond it as seen from the stronghold, or, for a stretch of the stronghold's own wall,
 * `behind` metres the way `out` `{ x, z }` of it faces; the defenders look over that wall, so it is `overlooked`.
 * A cover farther from the stronghold than he already is would be a retreat, so it is none for him. Without a cover,
 * one out of range runs in the open to a tenth within it, and one in range fights from where he landed: null. Where
 * he would not see the stronghold, as behind a house, he goes instead to the nearest free stretch of its wall.
 */
export default function fightingPlace(soldier, { spots, target, range, reach, behind, inSight = () => true }) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
  const ownDistance = distance(soldier, target)
  const [cover] = spots
    .filter(spot => !spot.taken && distance(spot, soldier) <= reach && distance(spot, target) < ownDistance
      && distance(spot, target) + behind <= range && inSight(spot))
    .sort((a, b) => distance(a, soldier) - distance(b, soldier))
  const take = spot => {
    spot.taken = true
    const away = distance(spot, target)
    const out = spot.out ?? { x: (spot.x - target.x) / away, z: (spot.z - target.z) / away }
    const goal = { x: spot.x + out.x * behind, z: spot.z + out.z * behind, cover: spot.height }
    return spot.out ? { ...goal, overlooked: true } : goal
  }
  if (cover) return take(cover)
  const near = ownDistance <= range ? 1 : range * .9 / ownDistance
  const open = { x: target.x + (soldier.x - target.x) * near, z: target.z + (soldier.z - target.z) * near }
  if (inSight(open)) return near < 1 ? open : null
  const [wall] = spots.filter(spot => !spot.taken && spot.out).sort((a, b) => distance(a, soldier) - distance(b, soldier))
  return wall ? take(wall) : null
}
