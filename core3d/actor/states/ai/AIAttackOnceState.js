import AnimOnceState from '../AnimOnceState.js'

export default class AIAttackOnceState extends AnimOnceState {
  enter(oldState, oldAction) {
    super.enter(oldState, oldAction)
    this.actor.lookAtTarget()
  }

  exit() {
    if (this.actor.exitAttack) this.actor.exitAttack()
  }
}