/** Seconds ahead on the path that give the way the body flies. */
const lookAhead = .05

/**
 * Flies a body along a path: `position(t)` gives where the body is `t` seconds into its flight, at any frame rate. A
 * body with a `delay` starts that much later, still behind on the path. The body is put at its start at once, flies
 * while it lives and faces the way it goes. It has `alive`, `x`, `y` and `face(direction)`.
 */
export default class PathFlight {
  constructor(body, { position, delay = 0 }) {
    this.body = body
    this.position = position
    this.age = -delay
    this.fly(0)
  }

  /** Whether the flight has begun, after its delay. */
  get started() {
    return this.age >= 0
  }

  fly(dt) {
    const { body } = this
    this.age += dt
    const { x, y } = this.position(this.age)
    const ahead = this.position(this.age + lookAhead)
    if (ahead.x !== x || ahead.y !== y) body.face(Math.atan2(ahead.y - y, ahead.x - x))
    body.x = x
    body.y = y
  }

  update(dt) {
    if (this.body.alive) this.fly(dt)
  }
}
