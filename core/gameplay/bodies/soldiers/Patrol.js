import Body from '../Body.js'

/** A patrol's pace while it searches, in metres a second, measured at 40 px a metre, where a man is about 1.8 m. */
export const patrol = { speed: 2.25 }

/** The patrol searches, walking on the way it heads, or halts. */
const states = {
  search: {
    update: body => {
      body.vx = Math.cos(body.yaw) * patrol.speed
      body.vz = -Math.sin(body.yaw) * patrol.speed
    },
  },
  halt: {
    enter: body => {
      body.vx = body.vz = 0
    },
  },
}

/** A patrol seen from above, heading along `yaw`. Where it turns, and when, is up to the world. */
export default class Patrol extends Body {
  constructor(options = {}) {
    super({ size: { length: 1.775, height: 1.8, width: 2 }, ...options, states })
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** Heads along `yaw`. */
  head(yaw) {
    this.yaw = yaw
  }
}
