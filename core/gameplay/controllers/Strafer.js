/**
 * A fighter's strafing pass, in metres: its speed; how far ahead of the target it starts its dive, nearer than
 * `farthest` and than `farthestView` of the view's width, farther than `nearest`; the steepest dive and how fast it
 * turns to it, in radians and radians a second; how far off the target its nose may be when it fires, in radians; how
 * near it pulls up, and how low it dives at most, above the ground.
 */
export const strafe = { speed: 7.39, nearest: 7.92, farthest: 44.88, farthestView: .9, maxDive: Math.PI / 10, pitchRate: .35,
  aim: .03, pullUp: 8.8, lowest: 6.51 }

/**
 * Flies a fighter once past a target ahead of it: level until the target is ahead within reach, then down at it in one
 * dive, firing while the target lives, the fighter `sees(target)` and its nose is on it, and level again once near it or
 * low enough. It dives on the target itself, or where `aim(target, body)` gives, such as `lead` of `Gunner`.
 * `viewWidth()` gives the width of the view in metres. The body has `x`, `y`, `forward`, `pitch`, `alive`,
 * `steer(vx, vy)`, `setState` and the states `idle` and `fire`; the target has `x`, `y` and `alive`.
 */
export default class Strafer {
  constructor(body, target, { sees, viewWidth, groundAt = () => 0, aim = target => target }) {
    Object.assign(this, { body, target, sees, viewWidth, groundAt, aim })
    this.phase = 'approach'
    this.pitch = 0
  }

  /** The pitch that points the nose at where it aims. */
  get sightPitch() {
    const { body } = this, point = this.aim(this.target, body)
    return -Math.atan2(Math.max(0, body.y - point.y), Math.abs(body.x - point.x))
  }

  update(dt = 0) {
    const { body, target } = this
    if (!body.alive) return
    const lead = body.forward * (target.x - body.x)
    if (this.phase === 'approach' && lead > strafe.nearest && lead < Math.min(strafe.farthest, this.viewWidth() * strafe.farthestView))
      this.phase = 'dive'
    const low = body.y - this.groundAt(body.x) <= strafe.lowest
    if (this.phase === 'dive' && (low || lead <= strafe.pullUp)) this.phase = 'done'
    const sight = this.sightPitch
    // the dive points the nose at where it aims, no steeper than it can
    const wanted = this.phase === 'dive' ? Math.max(-strafe.maxDive, sight) : 0
    const step = strafe.pitchRate * dt
    this.pitch += Math.max(-step, Math.min(step, wanted - this.pitch))
    body.steer(body.forward * strafe.speed * Math.cos(this.pitch), strafe.speed * Math.sin(this.pitch))
    const onTarget = Math.abs(this.pitch - sight) <= strafe.aim
    body.setState(this.phase === 'dive' && target.alive && this.sees(target) && onTarget ? 'attack' : 'idle')
  }
}
