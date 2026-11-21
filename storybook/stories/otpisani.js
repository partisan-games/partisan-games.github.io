import Occupier, * as occupierModule from '/core/gameplay/bodies/soldiers/Occupier.js'
import OccupierSprite from '/core/actor/soldiers/OccupierSprite.js'

/** The occupier walks in from the left edge, his feet on the ground line. */
const occupier = stage => {
  const body = new Occupier({ x: 0, y: .9 })
  stage.add(body, new OccupierSprite(body, { projection: stage.projection, camera: stage }))
  return body
}

export const soldiers = [
  { id: 'okupator', name: 'Okupator', game: 'Otpisani', block: occupierModule, create: occupier, pxPerMeter: 100 },
]
