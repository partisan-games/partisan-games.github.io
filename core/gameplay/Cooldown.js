/**
 * A wait between two actions, on a clock that has `now` in seconds. On a game clock it waits in a pause.
 * It starts ready; start() begins the wait.
 */
export default class Cooldown {
  #readyAt = -Infinity

  constructor({ seconds, clock }) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Cooldown seconds must be a finite non-negative number')
    this.seconds = seconds
    this.clock = clock
  }

  get ready() {
    return this.clock.now >= this.#readyAt
  }

  /** Waits `seconds`, by default the usual wait; a varied wait keeps several shooters out of step. */
  start(seconds = this.seconds) {
    this.#readyAt = this.clock.now + seconds
  }
}
