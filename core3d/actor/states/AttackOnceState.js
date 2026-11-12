import AnimOnceState from './AnimOnceState.js'

export default class AttackOnceState extends AnimOnceState {
  enter(oldState, oldAction) {
    if (this.action)
      super.enter(oldState, oldAction)
    else
      this.duration = .3 // seconds

    this.actor.enterAttack()
  }

  update(delta) {
    if (this.actor.turnWhileAttack)
      this.actor.updateTurn(delta)

    /* TRANSIT */

    if (!this.action && this.actor.age - this.last >= this.duration)
      this.actor.setState(this.prevOrIdle)
  }

  exit() {
    if (this.actor.exitAttack) this.actor.exitAttack()
  }
}