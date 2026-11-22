import Body from '../Body.js'
import { stand } from '../ground.js'

/** The hit box of each bearer in metres: the Italian one holds his flag farther out. */
export const bearerKinds = {
  partisan: { size: { length: 1.5, height: 2, width: .25 } },
  italian: { size: { length: 2, height: 2, width: .25 } },
}

const stop = body => {
  body.vx = 0
}
const states = {
  idle: { enter: stop },
  move: { update: body => {
    body.vx = Math.cos(body.yaw) * 1.25
  } },
  dead: { enter: stop },
}

/**
 * A flag bearer, facing right (yaw 0) or left (yaw π), who stands with his side's flag on `groundAt(x)`, which may
 * give way under him.
 */
export default class FlagBearer extends Body {
  constructor({ kind = bearerKinds.partisan, groundAt = () => 0, ...rest } = {}) {
    super({ size: kind.size, ...rest, states })
    this.groundAt = groundAt
    this.y = groundAt(this.x) + this.size.height / 2
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return
    super.setState(name)
  }

  update(dt) {
    super.update(dt)
    stand(this, dt)
  }
}
