import Body from '../Body.js'
import { trench } from './TrenchSoldier.js'

/** He runs to his cover at `speed` metres a second; he aims, fires and hurts as a soldier in a trench does. */
export const coverSoldier = { speed: 2.5, size: { length: .5, height: 1.8, width: .5 } }

const stop = soldier => {
  soldier.vx = soldier.vz = 0
}

const states = {
  idle: { enter: stop },
  move: {
    update: soldier => {
      const { goal } = soldier
      if (!goal) return soldier.setState('idle')
      const dx = goal.x - soldier.x, dz = goal.z - soldier.z
      const distance = Math.hypot(dx, dz)
      if (distance < .05) {
        soldier.x = goal.x
        soldier.z = goal.z
        soldier.inCover = Boolean(goal.cover)
        return soldier.setState('idle')
      }
      soldier.vx = dx / distance * soldier.speed
      soldier.vz = dz / distance * soldier.speed
    },
  },
  aim: {
    enter: stop,
    update: soldier => {
      if (soldier.stateTime >= trench.aimTime) soldier.setState('attack')
    },
  },
  attack: {
    enter: soldier => {
      soldier.shotsFired++
    },
    update: (soldier, dt) => {
      const { target } = soldier
      if (!target?.alive) return soldier.setState('idle')
      const elapsed = Math.floor(soldier.stateTime / trench.shotInterval)
      const previous = Math.floor(Math.max(0, soldier.stateTime - dt) / trench.shotInterval)
      soldier.shotsFired += elapsed - previous
      target.takeHit(trench.damage * dt)
    },
  },
  dead: { enter: stop },
}

/**
 * A soldier on foot, seen from the front, who fights from where he stands: sent to a `goal` `{ x, z, cover }`, he runs
 * there and, if `cover` gives the height of a cover there in metres, ducks behind it. Told to fire at a `target`, any body with `alive` and `takeHit`, he
 * rises, aims for a while, so the other side can shoot him first, then fires a burst that hurts the target each
 * second until told to cease fire or the target dies. Behind cover he can be hit only while he is up.
 */
export default class CoverSoldier extends Body {
  constructor({ speed = coverSoldier.speed, size = coverSoldier.size, ...rest } = {}) {
    super({ size, ...rest, states })
    this.speed = speed
    this.goal = null
    this.target = null
    this.inCover = false
  }

  moveTo(goal) {
    if (this.dead) return
    this.goal = goal
    this.inCover = false
    this.setState('move')
  }

  fireAt(target) {
    if (this.dead || this.state === 'move') return
    this.target = target
    this.setState('aim')
  }

  ceaseFire() {
    if (this.state === 'aim' || this.state === 'attack') this.setState('idle')
  }

  /** Whether a shot can reach him: always in the open, behind cover only while he is up to fire. */
  get exposed() {
    return this.alive && (!this.inCover || this.state === 'aim' || this.state === 'attack')
  }
}
