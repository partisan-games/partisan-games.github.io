import canvas2d, { ctx } from '/core/io/canvas2d.js'
import Shell from '/core/actor/projectiles/Shell.js'
import { randomInRange } from '/core/utils.js'
import { firstContact } from '/core/collision/sweep.js'

/** When a value moving evenly from `from` to `to` during a step first reaches `limit`, or null. */
function whenReaches(from, to, limit) {
  if (from >= limit) return 0
  return to >= limit ? (limit - from) / (to - from) : null
}

const earliest = (...times) => times.reduce((first, time) => time !== null && (first === null || time < first) ? time : first, null)

export default class Djule extends Shell {
  constructor({ r = 4, wind, ...rest } = {}) {
    super({ src: null, ...rest })
    this.r = r
    this.width = this.height = r * 2
    this.damage = randomInRange(20, 30)
    this.wind = wind
  }

  get shown() {
    return this.visible
  }

  update(dt) {
    if (this.visible && !this.timerId) this.dx += (this.wind?.acceleration || 0) * dt
    super.update(dt)
  }

  /** The flight ends in `resolveFlight`, after everything has moved, not while the shell moves. */
  checkBounds() {}

  /**
   * Ends the flight at the first thing on the way of this step: a target, the ground or a side of the screen.
   * A high arc may leave the top of the screen and come back.
   */
  resolveFlight(targets) {
    if (!this.visible || this.timerId || !this.path) return
    const { start, end } = this.path
    const hit = firstContact({ start, end, radius: this.r }, targets)
    const landing = whenReaches(start.y + this.r, end.y + this.r, this.groundLevel)
    const exit = earliest(
      whenReaches(-start.x - this.r, -end.x - this.r, 0),
      whenReaches(start.x - this.r, end.x - this.r, canvas2d.width),
    )
    const first = earliest(hit?.time ?? null, landing, exit)
    if (first === null) return

    const at = time => this.setPosition(start.x + (end.x - start.x) * time, start.y + (end.y - start.y) * time)
    if (hit?.time === first) {
      at(first)
      this.strike(hit.target)
    } else if (landing === first) {
      at(first)
      this.land()
    } else this.reset()
  }

  land() {
    this.stop()
    this.explode()
    this.timerId = this.clock.after(.15, () => this.reset())
  }

  render() {
    if (!this.visible) return

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()
  }
}
