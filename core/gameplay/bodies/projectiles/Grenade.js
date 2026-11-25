import Body from '../Body.js'

/**
 * A hand grenade: the seconds from its throw to its burst (`fuse`); the share of its speed it keeps bouncing off the
 * ground or a wall (`bounce`), below which, in metres a second up, it stops bouncing and slides (`settle`), and the
 * share of its speed it keeps each second sliding (`slide`); the seconds its burst lasts, and how far from where it
 * bursts the burst reaches, in metres.
 */
export const grenade = { fuse: .5, bounce: .3, settle: .5, slide: .05, burst: .3, radius: .75 }

/** It lies unused, or flies, bounces and slides until its fuse burns down, or bursts. */
const states = {
  idle: {},
  flight: { update: body => body.fly() },
  burst: {
    enter: body => {
      body.bursts++
      body.onBurst({ x: body.x, y: body.y, z: body.z })
    },
    update: body => {
      if (body.stateTime >= grenade.burst) body.setState('idle')
    },
  },
}

/**
 * A hand grenade, which flies from the hand that throws it, falls as its world pulls, bounces off the ground and what
 * blocks it, and bursts when its fuse burns down, in the air or on the ground, calling `onBurst(point)`; what the burst
 * reaches is up to the world. `groundAt(x, z)` is the ground's height and `isBlocked(from, direction, distance)` whether
 * something stands in its way. `bursts` counts its bursts.
 */
export default class Grenade extends Body {
  constructor({ onBurst = () => {}, groundAt = () => 0, isBlocked = () => false, ...rest } = {}) {
    super({ size: { length: .1, height: .1, width: .1 }, ...rest, states })
    Object.assign(this, { onBurst, groundAt, isBlocked })
    this.bursts = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  /** Throws it from `from` with `velocity`, { x, y, z } in metres and metres a second. */
  launch(from, velocity) {
    Object.assign(this, from)
    this.path = { start: 0, from: { ...from }, velocity: { ...velocity }, sliding: false }
    this.time = 0
    this.setState('flight')
  }

  /** Where its path puts it `time` seconds after the throw. */
  at(time) {
    const { start, from, velocity, sliding } = this.path
    const t = time - start
    if (sliding) {
      // its speed falls to the `slide` share each second, so it covers v (slide^t - 1) / ln(slide)
      const along = (grenade.slide ** t - 1) / Math.log(grenade.slide)
      const x = from.x + velocity.x * along, z = from.z + velocity.z * along
      return { x, y: this.groundAt(x, z), z }
    }
    return { x: from.x + velocity.x * t, y: from.y + velocity.y * t - this.gravity * t * t / 2, z: from.z + velocity.z * t }
  }

  /** Follows its path to now, or to its fuse, bouncing on the way, and bursts when the fuse burns down. */
  fly() {
    const now = Math.min(this.stateTime, grenade.fuse)
    let point = this.at(now)
    const was = { x: this.x, y: this.y, z: this.z }
    const way = { x: point.x - was.x, y: point.y - was.y, z: point.z - was.z }
    const distance = Math.hypot(way.x, way.y, way.z)
    if (distance > 0 && this.isBlocked(was, { x: way.x / distance, y: way.y / distance, z: way.z / distance }, distance)) {
      // a wall sends it back from where it was
      const { velocity } = this.path
      this.path = { start: this.time, from: was, velocity: { x: -velocity.x * grenade.bounce, y: this.speedUp(this.time),
        z: -velocity.z * grenade.bounce }, sliding: this.path.sliding }
      point = this.at(now)
    }
    point = this.land(point, now)
    Object.assign(this, point)
    this.time = now
    if (now >= grenade.fuse) this.setState('burst')
  }

  /** Its speed up `time` seconds after the throw, in flight. */
  speedUp(time) {
    return this.path.sliding ? 0 : this.path.velocity.y - this.gravity * (time - this.path.start)
  }

  /** Where it is at `now`, once it has met the ground on the way: it bounces up from there, or settles and slides. */
  land(point, now) {
    if (this.path.sliding) return point
    const ground = this.groundAt(point.x, point.z)
    if (point.y > ground) return point
    const { start, from, velocity } = this.path
    // when its fall reaches the height of that ground
    const g = this.gravity, drop = from.y - ground
    const t = (velocity.y + Math.sqrt(velocity.y ** 2 + 2 * g * Math.max(0, drop))) / g
    const contact = { x: from.x + velocity.x * t, y: ground, z: from.z + velocity.z * t }
    const up = -(velocity.y - g * t) * grenade.bounce
    const horizontal = { x: velocity.x * grenade.bounce, z: velocity.z * grenade.bounce }
    const sliding = up < grenade.settle
    this.path = { start: start + t, from: contact, velocity: { ...horizontal, y: sliding ? 0 : up }, sliding }
    return now > start + t ? this.land(this.at(now), now) : contact
  }
}
