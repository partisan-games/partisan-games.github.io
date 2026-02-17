import AnimOnceState from './AnimOnceState.js'

export default class JumpState extends AnimOnceState {

  enter(oldState, oldAction) {
    super.enter(oldState, oldAction)

    if (this.actor.input.down) this.actor.anim.reverseClip(this.name)
  }

  update(delta) {
    this.actor.updateMove(delta)
  }

  exit() {
    this.actor.anim?.resetSpeed(this.name)
  }
}