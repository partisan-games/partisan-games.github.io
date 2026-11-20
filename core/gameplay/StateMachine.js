/**
 * Which one of its named states an owner is in. A state is a plain object with optional `enter(owner, from)`,
 * `update(owner, dt)` and `exit(owner, to)`; the owner and its states decide when to change state.
 */
export default class StateMachine {
  #current = null

  constructor(owner, states, initial) {
    this.owner = owner
    this.states = states
    this.set(initial)
  }

  get name() {
    return this.#current
  }

  get names() {
    return Object.keys(this.states)
  }

  /** Leaves the current state and enters `name`; entering the state it is already in does nothing. */
  set(name) {
    if (!Object.hasOwn(this.states, name)) throw new RangeError(`Unknown state: ${name}`)
    if (name === this.#current) return
    const from = this.#current
    if (from) this.states[from].exit?.(this.owner, name)
    this.#current = name
    this.states[name].enter?.(this.owner, from)
  }

  update(dt) {
    this.states[this.#current].update?.(this.owner, dt)
  }
}
