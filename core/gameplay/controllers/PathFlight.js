/** Seconds ahead on the path that give the way the body flies. */
const lookAhead = .05

/**
 * Flies a body seen from above along a path: `position(t)` gives where the body is, `{ x, z }` in metres, `t` seconds
 * into its flight, at any frame rate. A body with a `delay` starts that much later, still behind on the path. The body
 * is put at its start at once, flies while it lives and faces the way it goes. It has `alive`, `x`, `z` and
 * `face(yaw)`, with yaw about +y from +x.
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
    const { x, z } = this.position(this.age)
    const ahead = this.position(this.age + lookAhead)
    if (ahead.x !== x || ahead.z !== z) body.face(Math.atan2(-(ahead.z - z), ahead.x - x))
    body.x = x
    body.z = z
  }

  update(dt) {
    if (this.body.alive) this.fly(dt)
  }
}
