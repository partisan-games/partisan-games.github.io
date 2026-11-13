export const aircraft = [
  { id: 'spitfire', name: 'Spitfire Mk Vb', image: 'armies/partizani/avioni/spitfire-mkvb-realistic.png' },
  { id: 'hurricane', name: 'Hurricane Mk IV', image: 'armies/partizani/avioni/hurricane-mkiv-realistic.png' },
]

export function getAircraft(id) {
  const plane = aircraft.find(plane => plane.id === id)
  if (!plane) throw new Error(`Unknown aircraft: ${id}`)
  return plane
}
