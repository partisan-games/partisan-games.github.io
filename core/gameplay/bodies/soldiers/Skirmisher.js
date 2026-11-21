import Body from '../Body.js'
import { stand } from '../ground.js'

/** Seconds between two shots of a firing skirmisher. */
export const volley = { interval: 3 }
/** Walking is an optional command; the battle line keeps its existing idle/fire behaviour. */
export const gait = { rise: .6, speed: 1 }

const stop = soldier => {
  soldier.vx = 0
}

/** He stands with his rifle, or fires it into the distance again and again. */
const states = {
  idle: { enter: stop },
  fire: {
    update: soldier => {
      if (soldier.stateTime < volley.interval * (soldier.shotsInState + 1)) return
      soldier.shotsInState++
      soldier.shotsFired++
    },
    enter: soldier => {
      stop(soldier)
      soldier.shotsInState = 0
    },
  },
  standUp: {
    enter: stop,
    update: soldier => {
      if (soldier.stateTime >= gait.rise) soldier.setState('walk')
    },
  },
  walk: {
    enter: (soldier, from) => {
      if (from !== 'standUp') soldier.setState('standUp')
    },
    update: soldier => {
      soldier.vx = Math.cos(soldier.yaw) < 0 ? -gait.speed : gait.speed
    },
  },
  kneel: {
    enter: stop,
    update: soldier => {
      if (soldier.stateTime >= gait.rise) {
        soldier.standing = false
        soldier.setState(soldier.afterKneel || 'idle')
      }
    },
  },
  dead: { enter: stop },
}

/**
 * A soldier in the line who fires at the enemy far off, hitting nothing that the game counts, standing on
 * `groundAt(x)`, which may give way under him.
 */
export default class Skirmisher extends Body {
  constructor({ groundAt = () => 0, ...rest } = {}) {
    super({ size: { length: 2.2, height: 2, width: .25 }, ...rest, states })
    this.groundAt = groundAt
    this.shotsInState = 0
    this.y = groundAt(this.x) + this.size.height / 2
    this.standing = false
    this.fellStanding = false
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    if (name === 'dead') this.fellStanding = this.standing || this.state === 'standUp'
    if (['idle', 'fire'].includes(name) && this.standing) {
      this.afterKneel = name
      return super.setState('kneel')
    }
    if (name === 'walk' && this.state === 'standUp') this.standing = true
    if (['idle', 'fire'].includes(name)) this.standing = false
    super.setState(name)
  }

  update(dt) {
    super.update(dt)
    stand(this, dt)
  }
}
