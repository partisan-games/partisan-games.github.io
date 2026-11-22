import Body from '../Body.js'

/**
 * A soldier in a trench, seen from the front: the seconds he aims after he rises, the damage his fire does each second
 * to the one he fires at, and the seconds he takes to fall back into the trench.
 */
export const trench = { aimTime: 2.5, damage: 10, fallTime: 1.2, shotInterval: .18 }

/**
 * The front-facing soldier can stand, side-step, take aim and fire a burst. Death ends the burst and holds the
 * fallen pose. In a trench the view shows him taking cover while idle and rising when he takes aim.
 */
const states = {
  idle: {},
  move: { update: (soldier, dt) => {
    soldier.x += 1.15 * dt
  } },
  aim: {
    update: soldier => {
      if (soldier.stateTime >= trench.aimTime) soldier.setState('attack')
    },
  },
  attack: {
    enter: soldier => {
      soldier.shotsFired++
    },
    update: (soldier, dt) => {
      const elapsed = Math.floor(soldier.stateTime / trench.shotInterval)
      const previous = Math.floor(Math.max(0, soldier.stateTime - dt) / trench.shotInterval)
      soldier.shotsFired += elapsed - previous
    },
  },
  dead: {},
}

/** A soldier in his trench, who rises to fire at the viewer; who fires at him, and how, is up to the world. */
export default class TrenchSoldier extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.6, height: 1.8, width: 1 }, ...options, states })
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  /** Whether he stands up out of the trench, where he can be hit. */
  get standing() {
    return this.state === 'aim' || this.state === 'attack'
  }

  get forward() {
    return 1
  }
}
