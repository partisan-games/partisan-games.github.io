import State from './State.js'
import { dir } from '/core3d/constants.js'

export default class FlyState extends State {
  constructor(actor, name) {
    super(actor, name)
    this.maxJumpTime = Infinity
  }

  enter(oldState, oldAction) {
    super.enter(oldState, oldAction)
    this.jumpTime = 0

    this.actor.anim?.playActionOnce(oldAction, this.name, this.actor.input.down)
  }

  get ableToJump() {
    return this.actor.input.jump && this.jumpTime < this.maxJumpTime
  }

  get shouldAddForce() {
    return this.actor.velocity.y < this.actor.maxVelocityY
  }

  update(delta) {
    const { actor } = this

    actor.updateTurn(delta)
    actor.updateMove(delta)
    actor.applyGravity(delta)

    if (this.ableToJump) {
      this.jumpTime += delta
      if (this.shouldAddForce)
        actor.velocity.y += actor.jumpForce * delta
    }

    if (actor.velocity.y > 0 && actor.directionBlocked(dir.up))
      actor.velocity.y = -actor.velocity.y

    actor.applyVelocityY(delta)

    /* TRANSIT */

    if (this.actor.velocity.y < 0 && !this.ableToJump)
      this.actor.setState('fall')
  }
}