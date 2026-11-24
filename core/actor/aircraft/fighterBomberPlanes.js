/** Real model dimensions in metres: fuselage length, overall height and wingspan (width). Sources: docs/STATISTIKE.md. */
export const fighterBomberPlanes = [
  { id: 'spitfire', name: 'Spitfire Mk Vb', image: 'armies/game-ready/avioni/spitfire-top.png', size: { length: 9.12, height: 3.86, width: 11.23 } },
  { id: 'hurricane', name: 'Hurricane Mk IV', image: 'armies/game-ready/avioni/hurricane-top.png', size: { length: 9.84, height: 4, width: 12.19 } },
  { id: 'breguet', name: 'Breguet 19', image: 'armies/game-ready/avioni/breguet-top.png', size: { length: 9.51, height: 3.69, width: 14.83 } },
  { id: 'yak', name: 'Yak-1b', image: 'armies/game-ready/avioni/yak-top.png', size: { length: 8.48, height: 2.64, width: 10 } },
  { id: 'il2', name: 'Il-2', image: 'armies/game-ready/avioni/il2-top.png', size: { length: 11.6, height: 4.17, width: 14.6 } },
]

export const enemyAircraftSizes = {
  bf109: { length: 8.94, width: 9.92, height: 2.6 },
  fw190: { length: 8.95, width: 10.5, height: 3.95 },
  bf110: { length: 12.65, width: 16.25, height: 3.5 },
  he111: { length: 16.4, width: 22.6, height: 4 },
}

/** Unidentified fighter paint variants deliberately use the Bf109 size reference. */
export const enemyAircraftSize = src => enemyAircraftSizes[src.split('/').pop().replace(/-top\.png$/, '')] ?? enemyAircraftSizes.bf109

export function fighterBomberPlane(id) {
  const plane = fighterBomberPlanes.find(plane => plane.id === id)
  if (!plane) throw new Error(`Unknown aircraft: ${id}`)
  return plane
}
