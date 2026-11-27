import AdvanceSprite from '/core/actor/AdvanceSprite.js'
import * as advanceArt from '/core/actor/advanceArt.js'
import Health from '/core/gameplay/Health.js'
import Flame from '/core/actor/Flame.js'
import scales from '../scales.js'

const pxPerMeter = scales.side
const commanderHit = 'Komandir pogođen'

function story(kind, id, name, game = 'The Germans Advance') {
  return { id, name, game, pxPerMeter, way: 1, block: advanceArt,
    create(stage, way) {
      const sprite = new AdvanceSprite(kind)
      const { clips } = sprite.sheet.art
      const hitDuration = sprite.crew?.seconds('hit')
      const tank = Boolean(sprite.damage)
      const states = Object.keys(clips)
      if (sprite.crew) states.push(commanderHit)
      if (tank) states.push('dead', 'wreck')
      const fire = tank && new Flame(0, 0, { reuseParticles: true })
      const smoke = tank && new Flame(0, 0, { reuseParticles: true })
      const actor = {
        x: stage.width / 2, state: 'idle', stateTime: 0, crewTime: 0, children: sprite.children,
        states,
        get destroyed() {
          return this.state === 'dead' || this.state === 'wreck'
        },
        ...(tank && {
          health: new Health(),
          takeHit(damage) {
            if (!this.health.alive) return false
            const killed = this.health.damage(damage)
            if (killed) this.setState('dead')
            return killed
          },
        }),
        setState(state) {
          if (!states.includes(state) || (this.destroyed && state !== 'dead' && state !== 'wreck')) return
          if (state !== commanderHit || this.state !== 'drive') this.stateTime = 0
          if (state === commanderHit || this.state === commanderHit) this.crewTime = 0
          this.state = state
          if (this.destroyed) this.health.damage(this.health.current)
          if (state === 'wreck') {
            fire.clear()
            smoke.clear()
          }
        },
        update(dt) {
          this.stateTime += dt
          this.crewTime += dt
          if (this.state === 'dead') {
            fire.x = smoke.x = this.x - way * sprite.worldWidth * pxPerMeter * .13
            fire.y = smoke.y = stage.groundY - sprite.height * pxPerMeter * .55
            fire.update(dt * .22)
            smoke.update(dt * .36)
          }
        },
        render(ctx) {
          const hit = this.state === commanderHit
          const damaged = this.health && this.health.current < this.health.maximum
          const name = hit ? 'drive' : this.state
          const pose = { name, time: this.stateTime, x: this.x, y: stage.groundY, scale: pxPerMeter, flip: way }
          const fall = hit && this.crewTime >= hitDuration
          const condition = this.destroyed ? 'dead' : damaged ? 'damaged' : undefined
          sprite.draw(ctx, { ...pose, crewName: fall ? 'dead' : hit ? 'hit' : 'idle',
            crewTime: fall ? this.crewTime - hitDuration : this.crewTime, condition })
          sprite.drawShot(ctx, { ...pose, age: this.stateTime })
          if (this.state === 'dead') {
            smoke.render(true)
            fire.render()
          }
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

export const vehicles = [
  story('tank', 'panzer-iii', 'Panzer III sa posadom'),
  story('t34', 't34-85', 'T-34-85', 'Otpisani'),
]
