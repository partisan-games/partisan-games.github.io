import Body from '../Body.js'

/**
 * A soldier in a trench, seen from the front: the seconds he aims after he rises, the damage his fire does each second
 * to the one he fires at, and the seconds he takes to fall back into the trench.
 */
export const trench = { aimTime: 2.5, damage: 10, fallTime: 1.2 }

/**
 * The soldier hides in his trench, or rises and aims, then fires until he is hit and falls back into the trench.
 * Hiding and firing last until he is set to another; aiming and falling end by themselves.
 */
const states = {
  hidden: {},
  aim: {
    update: soldier => {
      if (soldier.stateTime >= trench.aimTime) soldier.setState('fire')
    },
  },
  fire: {},
  fall: {
    update: soldier => {
      if (soldier.stateTime >= trench.fallTime) soldier.setState('hidden')
    },
  },
}

/** A soldier in his trench, who rises to fire at the viewer; who fires at him, and how, is up to the world. */
export default class TrenchSoldier extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.6, height: 1.8, width: 1 }, ...options, states, initial: 'hidden' })
  }

  /** Whether he stands up out of the trench, where he can be hit. */
  get standing() {
    return this.state === 'aim' || this.state === 'fire'
  }

  get forward() {
    return 1
  }
}
