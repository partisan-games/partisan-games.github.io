import AdvanceSprite from '/core/actor/AdvanceSprite.js'
import * as advanceArt from '/core/actor/advanceArt.js'
import scales from '../scales.js'

const game = 'The Germans Advance'
const pxPerMeter = scales.side

function story(kind, id, name) {
  return { id, name, game, pxPerMeter, way: 1, block: advanceArt,
    create(stage, way) {
      const sprite = new AdvanceSprite(kind)
      const { clips } = sprite.sheet.art
      const actor = {
        x: stage.width / 2, state: 'idle', stateTime: 0, children: sprite.children,
        states: Object.keys(clips),
        setState(state) {
          this.state = state
          this.stateTime = 0
        },
        update(dt) {
          this.stateTime += dt
        },
        render(ctx) {
          const pose = { name: this.state, time: this.stateTime, x: this.x, y: stage.groundY, scale: pxPerMeter, flip: way }
          sprite.draw(ctx, pose)
          sprite.drawShot(ctx, { ...pose, age: this.stateTime })
        },
      }
      stage.add(actor)
      return actor
    },
  }
}

export const soldiers = [
  story('rifleman', 'advance-strelac', 'Nemački strelac · The Germans Advance'),
  story('gunner', 'advance-mitraljezac', 'Nemački mitraljezac · The Germans Advance'),
  story('backpack', 'advance-strelac-ranac', 'Nemački strelac sa rancem'),
  story('officer', 'advance-podoficir', 'Nemački podoficir · znak za napredovanje'),
]

export const vehicles = [story('tank', 'panzer-iii', 'Panzer III sa posadom')]
