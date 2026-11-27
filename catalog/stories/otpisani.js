import Occupier, * as occupierModule from '/core/gameplay/bodies/soldiers/Occupier.js'
import FrontEnemySprite from '/core/actor/soldiers/FrontEnemySprite.js'
import ArtClip from '/core/actor/ArtClip.js'
import * as frontEnemyArt from '/core/actor/soldiers/frontEnemyArt.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

function poseStory(id, name, art, initialPose) {
  return {
    id, name, game: 'Otpisani', block: frontEnemyArt, pxPerMeter: scales.front, catalogGroup: ['Vojnici', 'Nemci'],
    create(stage) {
      const sheet = new ArtClip(art)
      const actor = {
        x: stage.width / 2,
        state: initialPose,
        states: Object.keys(art.clips),
        children: [sheet],
        setState(state) {
          this.state = state
        },
        render(ctx) {
          sheet.draw(ctx, { name: this.state, time: 0, x: this.x, y: stage.groundY, scaleX: 1 })
        },
      }
      stage.add(actor)
      return actor
    },
  }
}

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
  poseStory('otpisani-mitraljezac', 'Mitraljezac iza zaklona', frontEnemyArt.coveredMachineGunner, 'peek'),
  poseStory('otpisani-automatar', 'Vojnik s automatom', frontEnemyArt.submachineGunner, 'attack'),
]
