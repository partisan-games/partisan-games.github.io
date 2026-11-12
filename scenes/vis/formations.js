/*
 * Formations of enemy planes. Each member flies the formation's path, shifted across it by
 * `across` px and starting `delay` seconds later, so the formation keeps its shape on any path.
 */

const centered = (count, gap) => Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * gap)

const formations = {
  single: () => [{ across: 0, delay: 0 }],
  pair: (count, gap) => centered(2, gap).map(across => ({ across, delay: 0 })),
  line: (count, gap) => centered(count, gap).map(across => ({ across, delay: 0 })),
  column: (count, gap, speed) => Array.from({ length: count }, (_, i) => ({ across: 0, delay: i * gap / speed })),
  vee: (count, gap, speed) => centered(count, gap).map(across => ({ across, delay: Math.abs(across) / speed })),
}

const defaultCounts = { single: 1, pair: 2, line: 4, column: 4, vee: 5 }

/** Where each plane of a formation flies, relative to the formation's path. */
export function formationMembers({ formation = 'single', count = defaultCounts[formation], gap, speed }) {
  return formations[formation](count, gap, speed)
}
