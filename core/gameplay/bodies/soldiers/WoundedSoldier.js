import Body from '../Body.js'

/**
 * A wounded soldier crawling, seen from above, measured from the earlier pixel soldier at 40 px a metre and 30 frames
 * a second: the push of crawling in metres a second squared, back at half of it; how fast he turns, in radians a
 * second; and the share of his speed he keeps each second.
 */
export const crawl = { thrust: 2.25, turn: .3, keep: .9 ** 30 }

/** He crawls as he is steered, or lies dead. */
const states = { idle: {}, dead: {} }

/** A wounded soldier who crawls the way he heads, `yaw`, seen from above. */
export default class WoundedSoldier extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.725, height: .3, width: .675 }, health: 1, ...options, states })
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** Crawls ahead. */
  throttle(dt) {
    this.push(crawl.thrust * dt)
  }

  /** Crawls back, slower. */
  back(dt) {
    this.push(-crawl.thrust / 2 * dt)
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
