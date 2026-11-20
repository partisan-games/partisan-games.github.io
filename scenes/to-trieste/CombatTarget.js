import Recurring from '/core/objects/Recurring.js'
import { wreckFor } from '/core/actor/wreckView.js'

/** Reuses the original scrolling, with a distinct combat life on every return. */
export default class CombatTarget extends Recurring {
  lifeId = 1

  constructor(options) {
    super(options)
    wreckFor(options.src)
  }

  reset() {
    this.lifeId++
    super.reset()
  }

  die(source) {
    if (this.dead) return
    this.alive = false
    this.callback?.(source)
  }
}
