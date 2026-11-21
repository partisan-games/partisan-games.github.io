import Body from '../Body.js'
import { stand } from '../ground.js'

/** Seconds a shot and its recoil take the crew before it stands by again. */
export const drill = { fire: .87 }

/** The crew stands by the gun, loads it while set to, or fires it and then stands by again. */
const states = {
  idle: {},
  load: {},
  fire: {
    update: crew => {
      if (crew.stateTime >= drill.fire) crew.setState('idle')
    },
  },
  dead: {},
}

/**
 * The crew of a field gun, facing right (yaw 0) or left (yaw π), standing on `groundAt(x)`, which may give way under
 * it. Who sets it to load or fire, and when, is up to the world.
 */
export default class CannonCrew extends Body {
  constructor({ groundAt = () => 0, ...rest } = {}) {
    super({ size: { length: 1.5, height: 1.5, width: .5 }, ...rest, states })
    this.groundAt = groundAt
    this.y = groundAt(this.x) + this.size.height / 2
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  update(dt) {
    super.update(dt)
    stand(this, dt)
  }
}
