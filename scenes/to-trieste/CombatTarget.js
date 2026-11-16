import Recurring from '/core/objects/Recurring.js'

/** Reuses the original scrolling, with a distinct combat life on every return. */
export default class CombatTarget extends Recurring {
  lifeId = 1

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
