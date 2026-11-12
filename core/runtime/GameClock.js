/**
 * Game time and the actions that wait on it. Only its owner moves it, so actions wait while the owner does not:
 * in a pause, after the end of a game, and forever once the game is gone.
 */
export default class GameClock {
  #now = 0
  #lastId = 0
  #pending = new Map()

  /** Seconds of game time so far. */
  get now() {
    return this.#now
  }

  /** Runs the action after the given seconds of this clock's time; returns an id for cancel(). */
  after(seconds, action) {
    this.#pending.set(++this.#lastId, { at: this.#now + seconds, action })
    return this.#lastId
  }

  cancel(id) {
    this.#pending.delete(id)
  }

  advance(dt) {
    this.#now += dt
    const due = [...this.#pending].filter(([, timer]) => timer.at <= this.#now)
    for (const [id, { action }] of due)
      if (this.#pending.delete(id)) action() // an earlier action may have cancelled it
  }
}
