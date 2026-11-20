import State from './State.js'

const chooseDuration = prevState => {
  if (prevState === 'jump') return .15
  if (prevState === 'attack') return .15
  return .75
}

export default class RunState extends State {
  enter(oldState, oldAction) {
    super.enter(oldState)
    if (!this.actor.anim?.run) return

    this.transitFrom(oldAction, chooseDuration(this.prevState))

    this.timeScale = this.action.timeScale
    if (this.actor.input.down) this.actor.anim?.reverseClip(this.name, -this.timeScale)
  }

  update(delta) {
    const { actor } = this

    actor.updateMove(delta)
    actor.updateTurn(delta)
    actor.updateStrafe(delta)
  }

  exit() {
    this.actor.anim?.resetSpeed(this.name, this.timeScale)
  }
}
