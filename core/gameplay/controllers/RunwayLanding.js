/**
 * A landing seen from above, in metres a second: how fast the plane flies to the near end of the runway, how fast it
 * touches down there, and how fast it climbs away, gaining speed each second; and the share of its height it loses or
 * gains each second.
 */
export const landing = { approach: 15, touchdown: 10, climb: 5, liftRate: .7 }

/**
 * Lands a plane seen from above on a runway that runs up the view (towards a smaller z), lets it stand and takes it off
 * again: it flies to `runway.start` ({ x, z }), sinks as it rolls up to `runway.stop` and stands there, calling
 * `onLanded()`; after `rest` seconds it calls `onRested()` and climbs away up the runway, calling `onAirborne()` once
 * it flies at its height again. The body has `x`, `z`, `vx`, `vz` and `lift`, from 1 at its height to 0 on the ground.
 */
export default class RunwayLanding {
  constructor(body, { runway, rest, onLanded = () => {}, onRested = () => {}, onAirborne = () => {}, distanceScale = 1 }) {
    Object.assign(this, { body, runway, rest, onLanded, onRested, onAirborne, distanceScale })
    this.phase = 'approach'
    this.rested = 0
    this.speed = 0
  }

  /** Moves the body towards `point` at `speed`; returns whether it is there. */
  flyTo(point, speed, dt) {
    const { body } = this
    const dx = point.x - body.x, dz = point.z - body.z, distance = Math.hypot(dx, dz), step = speed * dt * this.distanceScale
    if (distance <= step) Object.assign(body, { x: point.x, z: point.z })
    else Object.assign(body, { x: body.x + dx / distance * step, z: body.z + dz / distance * step })
    return distance <= step
  }

  update(dt) {
    const { body, runway } = this
    body.vx = body.vz = 0
    if (this.phase === 'approach' && this.flyTo(runway.start, landing.approach, dt)) this.phase = 'roll'
    else if (this.phase === 'roll') {
      // braking evenly, it stops at the stop, on the ground by then
      const share = (body.z - runway.stop.z) / (runway.start.z - runway.stop.z)
      const speed = Math.max(.5, landing.touchdown * Math.sqrt(Math.max(0, share)))
      body.lift = Math.max(0, Math.min(body.lift, share))
      if (this.flyTo(runway.stop, speed, dt)) {
        body.lift = 0
        this.phase = 'rest'
        this.onLanded()
      }
    } else if (this.phase === 'rest') {
      this.rested += dt
      if (this.rested < this.rest) return
      this.phase = 'takeoff'
      this.onRested()
    } else if (this.phase === 'takeoff') {
      this.speed += landing.climb * dt
      body.z -= this.speed * dt * this.distanceScale
      body.lift = Math.min(1, body.lift + landing.liftRate * dt)
      if (body.lift < 1) return
      this.phase = 'done'
      this.onAirborne()
    }
  }
}
