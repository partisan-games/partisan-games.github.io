import Occupier, * as occupierModule from '/core/gameplay/bodies/soldiers/Occupier.js'
import OccupierSprite from '/core/actor/soldiers/OccupierSprite.js'
import { yawOf } from './helpers.js'

/** The occupier in the middle, facing `way`, his feet on the ground line. */
const occupier = (stage, way) => {
  const body = new Occupier({ x: stage.width / 2 / stage.projection.pxPerMeter, y: .9, yaw: yawOf(way) })
  stage.add(body, new OccupierSprite(body, { projection: stage.projection, camera: stage }))
  return body
}

export const soldiers = [
  { id: 'okupator', name: 'Okupator', game: 'Otpisani', way: 1, block: occupierModule, create: occupier, pxPerMeter: 100 },
]
