const INITIAL_POSITION = .28
const RELEASED_POSITION = .18
const FOLLOW_RATE = .45

/** The framing moves with throttle input; it never changes the boat's world velocity. */
export default class BoatCamera {
  position = INITIAL_POSITION

  update(dt, thrust, awayFromStart = true) {
    if (!thrust && !awayFromStart) return
    const destination = thrust ? INITIAL_POSITION : RELEASED_POSITION
    this.position += (destination - this.position) * -Math.expm1(-FOLLOW_RATE * dt)
  }

  screenX(width, hullWidth) {
    const margin = Math.min(width / 2, hullWidth / 2 + 16)
    return Math.min(width - margin, Math.max(margin, width * this.position))
  }

  left(worldX, width, hullWidth) {
    return Math.max(0, worldX - this.screenX(width, hullWidth))
  }
}
