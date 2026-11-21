/** The planes the player may fly: each picture is drawn at half its size, 10 px a metre, so it gives the plane's size. */
const fighter = { length: 15, height: 2, width: 12.75 }
export const aircraft = [
  { id: 'spitfire', name: 'Spitfire Mk Vb', image: 'armies/partizani/avioni/spitfire-mkvb-realistic.png', size: fighter },
  { id: 'hurricane', name: 'Hurricane Mk IV', image: 'armies/partizani/avioni/hurricane-mkiv-realistic.png', size: fighter },
  { id: 'breguet', name: 'Breguet 19', image: 'armies/partizani/avioni/breguet-19-realistic.png', size: { length: 15, height: 2, width: 10 } },
  { id: 'yak', name: 'Yak-1b', image: 'armies/partizani/avioni/yak-1b-realistic.png', size: fighter },
]

export function getAircraft(id) {
  const plane = aircraft.find(plane => plane.id === id)
  if (!plane) throw new Error(`Unknown aircraft: ${id}`)
  return plane
}
