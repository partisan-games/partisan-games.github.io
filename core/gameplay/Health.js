const validateAmount = amount => {
  if (!Number.isFinite(amount) || amount < 0)
    throw new RangeError('Health values must be finite non-negative numbers')
}

/** Numeric health only; lives, invulnerability and respawn belong to the game. */
export default class Health {
  #current
  #maximum

  constructor({ maximum = 100 } = {}) {
    validateAmount(maximum)
    this.#maximum = this.#current = maximum
  }

  get current() {
    return this.#current
  }

  get maximum() {
    return this.#maximum
  }

  get alive() {
    return this.#current > 0
  }

  /** Returns true only when this hit changes a living object into a dead one. */
  damage(amount) {
    validateAmount(amount)
    const wasAlive = this.alive
    this.#current = Math.max(0, this.#current - amount)
    return wasAlive && !this.alive
  }

  /** Restores health up to the maximum, including from zero. */
  heal(amount) {
    validateAmount(amount)
    this.#current = Math.min(this.#maximum, this.#current + amount)
  }

  reset() {
    this.#current = this.#maximum
  }
}
