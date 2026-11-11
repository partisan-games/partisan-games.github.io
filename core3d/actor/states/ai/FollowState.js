import WalkState from '../WalkState.js'
import { reactions } from '/core3d/constants.js'

export default class FollowState extends WalkState {

  enter(oldState, oldAction) {
    super.enter(oldState, oldAction)
    this.input.up = true
    this.actor.randomizeAction()
  }

  update(delta) {
    const { actor } = this

    actor.lookAtTarget()

    /* TRANSIT */

    if (!actor.targetInSightRange || actor.distanceToTarget < actor.followDistance || actor.blockedByTarget)
      return actor.setState('idle')

    actor.updateMove(delta, reactions.STEP_OFF)
  }

  exit() {
    this.input.up = false
  }
}
