/** Find a clear position above the same cube, reserving the coin's full rotating volume. */
export default function coinPosition(original, support, boxes, radius) {
  const clear = point => !boxes.some(box => point.x + radius > box.min.x && point.x - radius < box.max.x
    && point.y + radius > box.min.y && point.y - radius < box.max.y
    && point.z + radius > box.min.z && point.z - radius < box.max.z)
  if (clear(original)) return original.clone()
  const margin = radius + .05
  const halfX = (support.max.x - support.min.x) / 2 - margin
  const halfZ = (support.max.z - support.min.z) / 2 - margin
  if (halfX < 0 || halfZ < 0) throw new RangeError('The coin does not fit above its cube')
  const offsets = []
  for (let x = -2; x <= 2; x++)
    for (let z = -2; z <= 2; z++) offsets.push({ x: x * halfX / 2, z: z * halfZ / 2 })
  offsets.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
  const heights = [...new Set([original.y, ...boxes.map(box => box.max.y + margin).filter(y => y > original.y)])]
    .sort((a, b) => a - b)
  for (const y of heights)
    for (const offset of offsets) {
      const point = original.clone().set((support.min.x + support.max.x) / 2 + offset.x, y,
        (support.min.z + support.max.z) / 2 + offset.z)
      if (clear(point)) return point
    }
  throw new RangeError('No clear position for the Avatar coin')
}
