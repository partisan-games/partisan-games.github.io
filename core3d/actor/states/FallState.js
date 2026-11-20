import { jumpStyles } from '/core3d/constants.js'
import State from './State.js'

const movableJumps = [jumpStyles.FLY, jumpStyles.FLY_JUMP]

export default class FallState extends State {
  update(delta) {
    const { actor } = this

    actor.updateTurn(delta)
    actor.applyGravity(delta)
    actor.applyVelocityY(delta)

    if (movableJumps.includes(actor.jumpStyle) && actor.input.up)
      actor.updateMove(delta)

    if (actor.onGround) actor.velocity.y = 0
  }
}
