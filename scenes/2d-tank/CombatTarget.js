import Vracanje from '/core/objects/Vracanje.js'

/** Reuses the original scrolling, with a distinct combat life on every return. */
export default class CombatTarget extends Vracanje {
  lifeId = 1

  reset() {
    this.lifeId++
    super.reset()
  }

  umri(source) {
    if (this.dead) return
    this.alive = false
    this.callback?.(source)
  }
}
