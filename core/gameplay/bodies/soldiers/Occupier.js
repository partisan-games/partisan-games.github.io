import Body from '../Body.js'

/** An occupier's walking pace in metres a second, measured from the earlier pixel soldier at 100 px a metre, 1.8 m tall. */
export const occupier = { speed: 1.98 }

/** The occupier walks the way he faces, or stands and fires his burst at the viewer, or lies fallen. */
const states = {
  walk: {
    update: soldier => {
      soldier.vx = soldier.forward * occupier.speed
    },
  },
  fire: {
    enter: soldier => {
      soldier.vx = 0
    },
  },
  dead: {
    enter: soldier => {
      soldier.vx = 0
    },
  },
}

/**
 * An occupier seen from the front, facing right (yaw 0) or left (yaw π), who walks across and fires at the viewer;
 * one hit fells him. Who sets him to fire, and when, is up to the world.
 */
export default class Occupier extends Body {
  constructor(options = {}) {
    super({ size: { length: .5, height: 1.8, width: .25 }, health: 1, ...options, states })
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }
}
