import { fighter } from '../bodies/aircraft/Fighter.js'

/**
 * How a fighter passes a plane: from behind it overtakes it this much faster, in metres a second; it passes this far
 * above or below it, more than half their heights together so it never rams it, and near enough that its fire on the
 * way in can still hit; it passes below only with `clearance` metres left above the ground.
 */
export const interceptor = { overtake: 4.87, passOffset: 3.89, clearance: 3.25 }

/**
 * Flies a fighter past `plane` once: head on at its own speed, or from behind slowly overtaking it, at the plane's
 * height just above or below it, whichever side `random` picks where there is room. The body has `forward`, `dead`
 * and `steer(vx, vy)`; the plane has `x`, `y`, `vx` and `dead`.
 */
export default class Interceptor {
  constructor(body, { plane, groundAt = () => 0, random = Math.random }) {
    this.body = body
    this.plane = plane
    const roomBelow = plane.y - interceptor.passOffset > groundAt(plane.x) + interceptor.clearance
    /** 1 passes above the plane, -1 below. */
    this.passSide = roomBelow && random() < .5 ? -1 : 1
  }

  update() {
    const { body, plane } = this
    if (body.dead) return
    const vx = body.forward > 0 ? Math.max(plane.vx, 0) + interceptor.overtake : -fighter.speed
    const passY = plane.y + this.passSide * interceptor.passOffset
    body.steer(vx, plane.dead ? 0 : (passY - body.y) * 2)
  }
}
