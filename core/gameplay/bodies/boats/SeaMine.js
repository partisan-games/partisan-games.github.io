import Body from '../Body.js'
import { hullEntry } from '../projectiles/hits.js'

export const seaMine = { radius: .6, damage: 35 }

/** A floating contact mine; the scene decides which passing hulls may set it off. */
export default class SeaMine extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.2, height: 1.2, width: 1.2 }, health: 10, ...options,
      states: { idle: {}, dead: {} } })
  }

  hitTime(start, end) {
    return hullEntry({ start, end }, this)
  }
}
