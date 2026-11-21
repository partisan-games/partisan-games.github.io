import Body from '../Body.js'

/**
 * A hand grenade: the seconds it flies, how high it rises on the way, in metres, the seconds its burst lasts, and how
 * far from where it lands the burst reaches, in metres.
 */
export const grenade = { flight: .8, rise: 2, burst: .3, radius: .75 }

/** It lies unused, or flies in an arc from where it was thrown to where it lands, or bursts there. */
const states = {
  idle: {},
  flight: {
    update: body => {
      const share = Math.min(1, body.stateTime / grenade.flight)
      const { from, to } = body
      body.x = from.x + (to.x - from.x) * share
      body.z = from.z + (to.z - from.z) * share
      body.y = from.y + (to.y - from.y) * share + 4 * grenade.rise * share * (1 - share)
      if (share === 1) body.setState('burst')
    },
  },
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
 * A hand grenade thrown from one point to another, which bursts where it lands and calls `onBurst(point)`; what the
 * burst reaches is up to the world. `bursts` counts its bursts.
 */
export default class Grenade extends Body {
  constructor({ onBurst = () => {}, ...rest } = {}) {
    super({ size: { length: .1, height: .1, width: .1 }, ...rest, states })
    this.onBurst = onBurst
    this.bursts = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  /** Throws it from `from` to land at `to`, points { x, y, z } in metres. */
  launch(from, to) {
    Object.assign(this, { from: { ...from }, to: { ...to } }, from)
    this.setState('flight')
  }
}
