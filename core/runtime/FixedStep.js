/**
 * Splits frame time into equal simulation steps (A4-01: 1/60 s, at most 5 per drawn frame,
 * a frame counts at most .25 s). Whole steps beyond the limit are dropped, not made up later:
 * under heavy load the game slows down instead of jumping ahead.
 */
export default class FixedStep {
  #accumulator = 0

  constructor({ step = 1 / 60, maxSteps = 5, maxFrame = .25 } = {}) {
    this.step = step
    this.maxSteps = maxSteps
    this.maxFrame = maxFrame
    this.dropped = 0 // seconds of game time dropped so far, for diagnostics
  }

  /** How many steps this frame runs; the time left over waits for the next frame. */
  advance(dt) {
    this.dropped += Math.max(dt - this.maxFrame, 0)
    this.#accumulator += Math.min(dt, this.maxFrame)
    const due = Math.floor(this.#accumulator / this.step + 1e-9) // a whole step lost to rounding still counts
    const steps = Math.min(due, this.maxSteps)
    this.#accumulator -= due * this.step
    this.#accumulator = Math.max(this.#accumulator, 0)
    this.dropped += (due - steps) * this.step
    return steps
  }

  /** After a pause the time spent away is not owed to the game. */
  reset() {
    this.#accumulator = 0
  }
}
