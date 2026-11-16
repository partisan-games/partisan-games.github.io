import { placeShape } from './shapes.js'
import { sweepCircle } from './sweep.js'

/**
 * The collision shapes of one object, made of parts. Each part follows the body it is drawn with,
 * such as a turning barrel and its fixed carriage, so nothing copies their positions.
 * A collider has no health, team or damage: the object that owns it decides what a hit means.
 */
export default class Collider {
  /** @param parts [{ body, shapes }], with shapes measured in the body's frame (see shapes.js) */
  constructor(parts) {
    this.parts = parts
  }

  #startOfStep = new Map()

  /** The shapes where they are drawn now; a hidden body has none. */
  shapes() {
    return this.parts
      .filter(({ body }) => body.visible)
      .flatMap(({ body, shapes }) => shapes.map(shape => placeShape(shape, body)))
  }

  /** Called before anything moves in a step, so a sweep follows the bodies' movement during it. */
  beginStep() {
    for (const { body } of this.parts) this.#startOfStep.set(body, { x: body.x, y: body.y })
  }

  /**
   * When a round projectile moving from start to end in this step first touches a part, or null.
   * Each part keeps its current angle; seen from the part, the projectile also travels the way its body
   * moved since `beginStep`. A body that turns fast within one step is not followed.
   */
  sweep(start, end, radius = 0) {
    let first = null
    for (const { body, shapes } of this.parts) {
      if (!body.visible) continue
      const before = this.#startOfStep.get(body) || body
      const from = { x: start.x + body.x - before.x, y: start.y + body.y - before.y }
      for (const shape of shapes) {
        const time = sweepCircle(from, end, radius, placeShape(shape, body))
        if (time !== null && (first === null || time < first)) first = time
      }
    }
    return first
  }
}
