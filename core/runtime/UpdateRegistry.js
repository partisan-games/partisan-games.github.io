/**
 * The objects a game simulates, each updated once per step, wherever it sits in the scene graph.
 * Adding and removing during a step take effect after it: a new object joins from the next step,
 * and a removed one stops being a valid target at once.
 */
export default class UpdateRegistry {
  #active = new Set()
  #adding = new Set()
  #removing = new Set()

  add(...objects) {
    objects.forEach(object => {
      this.#removing.delete(object)
      if (!this.#active.has(object)) this.#adding.add(object)
    })
  }

  remove(...objects) {
    objects.forEach(object => {
      this.#adding.delete(object)
      if (this.#active.has(object)) this.#removing.add(object)
    })
  }

  /** Active and not removed in this step: whether something may still hit or target it. */
  has(object) {
    return this.#active.has(object) && !this.#removing.has(object)
  }

  get size() {
    return this.#active.size + this.#adding.size - this.#removing.size
  }

  /** `t` is the drawn frame's time, for objects that animate by it. */
  step(dt, t) {
    this.#flush()
    for (const object of this.#active)
      if (!this.#removing.has(object)) object.update(dt, t)
    this.#flush()
  }

  #flush() {
    this.#removing.forEach(object => this.#active.delete(object))
    this.#adding.forEach(object => this.#active.add(object))
    this.#removing.clear()
    this.#adding.clear()
  }
}
