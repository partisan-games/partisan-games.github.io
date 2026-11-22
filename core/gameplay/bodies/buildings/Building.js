import Body from '../Body.js'

/** How much a building takes before it is destroyed. */
export const building = { health: 150 }

/** It stands, or it lies destroyed. */
const states = {
  idle: {},
  dead: {},
}

/**
 * A building on the ground, its hit box `size` with `x, y, z` its middle: a factory, a civil house, a warehouse or a
 * tower, as its `kind` says. It does nothing; it only stands until it is destroyed.
 */
export default class Building extends Body {
  constructor({ kind = 'building', health = building.health, ...rest } = {}) {
    super({ health, ...rest, states })
    this.kind = kind
  }

  setState(name) {
    if (this.alive || name === 'dead') super.setState(name)
  }
}
