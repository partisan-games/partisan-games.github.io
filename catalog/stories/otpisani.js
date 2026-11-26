import Occupier, * as occupierModule from '/core/gameplay/bodies/soldiers/Occupier.js'
import FrontEnemySprite from '/core/actor/soldiers/FrontEnemySprite.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

export const soldiers = [
  ...[
    ['rifleman', 'otpisani-strelac', 'Strelac sa puškom'],
    ['sentry', 'otpisani-strazar', 'Stražar u šinjelu'],
  ].map(([kind, id, name]) => ({ id, name, game: 'Otpisani', way: 1, block: occupierModule, pxPerMeter: scales.front,
    catalogGroup: ['Vojnici', 'Nemci'],
    create(stage, way) {
      const body = new Occupier({ x: stage.width / 2 / stage.projection.pxPerMeter, y: .9,
        yaw: yawOf(way), shotInterval: enemyKinds[kind].shotInterval })
      stage.add(body, new FrontEnemySprite(body, { kind, projection: stage.projection, camera: stage }))
      return body
    } })),
]
