import Occupier, * as occupierModule from '/core/gameplay/bodies/soldiers/Occupier.js'
import OccupierSprite from '/core/actor/soldiers/OccupierSprite.js'
import FrontEnemySprite from '/core/actor/soldiers/FrontEnemySprite.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

/** The occupier in the middle, facing `way`, his feet on the ground line. */
const occupier = (stage, way) => {
  const body = new Occupier({ x: stage.width / 2 / stage.projection.pxPerMeter, y: .9, yaw: yawOf(way) })
  stage.add(body, new OccupierSprite(body, { projection: stage.projection, camera: stage }))
  return body
}

export const soldiers = [
  { id: 'okupator', name: 'Okupator', game: 'Zajednička biblioteka', way: 1, block: occupierModule, create: occupier, pxPerMeter: scales.front,
    catalogGroup: ['Vojnici', 'Nemački'] },
  ...[
    ['rifleman', 'otpisani-strelac', 'Strelac sa puškom'],
    ['sentry', 'otpisani-strazar', 'Stražar u šinjelu'],
  ].map(([kind, id, name]) => ({ id, name, game: 'Otpisani', way: 1, block: occupierModule, pxPerMeter: scales.front,
    catalogGroup: ['Vojnici', 'Nemački'],
    allowedSeasons: enemyKinds[kind].allowedSeasons,
    create(stage, way) {
      const body = new Occupier({ x: stage.width / 2 / stage.projection.pxPerMeter, y: .9,
        yaw: yawOf(way), shotInterval: enemyKinds[kind].shotInterval })
      stage.add(body, new FrontEnemySprite(body, { kind, projection: stage.projection, camera: stage }))
      return body
    } })),
]
