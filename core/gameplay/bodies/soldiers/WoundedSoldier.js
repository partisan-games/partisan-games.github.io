import Body from '../Body.js'

/**
 * A wounded soldier crawling, seen from above, measured from the earlier pixel soldier at 40 px a metre and 30 frames
 * a second: the push of crawling in metres a second squared, back at half of it; how fast he turns, in radians a
 * second; and the share of his speed he keeps each second.
 */
export const crawl = { thrust: 2.25, turn: .3, keep: .9 ** 30 }

/** He crawls as he is steered, or lies dead. */
const stop = body => {
  body.vx = body.vz = 0
  body.power = 1
}
const states = {
  idle: { enter: stop },
  move: { update: (body, dt) => body.push(crawl.thrust * body.power * dt) },
  dead: { enter: stop },
}

/** A wounded soldier who crawls the way he heads, `yaw`, seen from above. */
export default class WoundedSoldier extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.725, height: .3, width: .675 }, health: 1, ...options, states })
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** Crawls ahead. */
  throttle() {
    if (this.dead) return
    this.power = 1
    this.setState('move')
  }

  /** Crawls back, slower. */
  back() {
    if (this.dead) return
    this.power = -.5
    this.setState('move')
  }

  releaseThrottle() {
    if (this.state === 'move') this.setState('idle')
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return
    super.setState(name)
  }

  push(amount) {
    if (this.dead) return
    this.vx += Math.cos(this.yaw) * amount
    this.vz -= Math.sin(this.yaw) * amount
  }

  /** Turns right (1) or left (-1), as seen from above. */
  turn(way, dt) {
    if (this.alive) this.yaw -= way * crawl.turn * dt
  }

  update(dt) {
    super.update(dt)
    const keep = crawl.keep ** dt
    this.vx *= keep
    this.vz *= keep
  }
}
