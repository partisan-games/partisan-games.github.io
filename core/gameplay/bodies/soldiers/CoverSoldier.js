import Body from '../Body.js'
import { trench } from './TrenchSoldier.js'

/**
 * He runs to his cover at `speed` metres a second; he aims and fires as a soldier in a trench does, hurting as he does
 * up to `falloff.near` metres away and less beyond, down to `falloff.least` of it at `falloff.far` and farther.
 * Crouching, he is `crouch` metres tall, so a lower cover does not hide him; nor does one the enemy looks over from
 * close above, as the wall of the stronghold he attacks.
 */
export const coverSoldier = { speed: 2.5, size: { length: .5, height: 1.8, width: .5 }, crouch: 1.05,
  falloff: { near: 20, far: 120, least: .25 } }

/** The share of a burst's harm that reaches a target `distance` metres away. */
export const harmAt = (distance, { near, far, least } = coverSoldier.falloff) =>
  1 - (1 - least) * Math.min(1, Math.max(0, (distance - near) / (far - near)))

const stop = soldier => {
  soldier.vx = soldier.vz = 0
}

const states = {
  idle: { enter: stop },
  move: {
    update: soldier => {
      const { goal, waypoint } = soldier
      if (!goal) return soldier.setState('idle')
      const dx = waypoint.x - soldier.x, dz = waypoint.z - soldier.z
      const distance = Math.hypot(dx, dz)
      if (distance < .05) {
        soldier.x = waypoint.x
        soldier.z = waypoint.z
        if (soldier.route.shift()) return states.move.update(soldier)
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
      const distance = Math.hypot(target.x - soldier.x, target.y - soldier.y, target.z - soldier.z)
      target.takeHit(trench.damage * harmAt(distance) * dt, soldier)
    },
  },
  dead: { enter: stop },
}

/**
 * A soldier on foot, seen from the front, who fights from where he stands: sent to a `goal` `{ x, z, cover }`, he runs
 * there, by the points `{ x, z }` of his route first, and, if `cover` gives the height of a cover there in metres, ducks behind it, seen still if it is `overlooked`. Told to fire at a `target`, any body with `alive` and `takeHit`, he
 * rises, aims for a while, so the other side can shoot him first, then fires a burst that hurts the target each
 * second until told to cease fire or the target dies. Behind cover he can be hit only while he is up.
 */
export default class CoverSoldier extends Body {
  constructor({ speed = coverSoldier.speed, size = coverSoldier.size, ...rest } = {}) {
    super({ size, ...rest, states })
    this.speed = speed
    this.goal = null
    /** The points he still runs by on his way to his goal. */
    this.route = []
    this.target = null
    this.inCover = false
  }

  moveTo(goal, via = []) {
    if (this.dead) return
    this.goal = goal
    this.route = [...via]
    this.inCover = false
    this.setState('move')
  }

  /** The point he runs to next: the first of his route, or his goal. */
  get waypoint() {
    return this.route[0] ?? this.goal
  }

  fireAt(target) {
    if (this.dead || this.state === 'move') return
    this.target = target
    this.setState('aim')
  }

  ceaseFire() {
    if (this.state === 'aim' || this.state === 'attack') this.setState('idle')
  }

  /** Whether a shot can reach him: always in the open, behind cover too low for him and while he is up to fire. */
  get exposed() {
    const hidden = this.inCover && !this.goal.overlooked && this.goal.cover >= coverSoldier.crouch
    return this.alive && (!hidden || this.state === 'aim' || this.state === 'attack')
  }
}
