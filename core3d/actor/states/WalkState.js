import State from './State.js'

const chooseDuration = prevState => {
  if (prevState === 'idle') return .25
  if (prevState === 'jump') return .15
  if (prevState === 'attack') return .15
  return .5
}

export default class WalkState extends State {
  enter(oldState, oldAction) {
    super.enter(oldState)
    if (!this.actor.anim?.walk) return

    this.transitFrom(oldAction, chooseDuration(oldState?.name))

    if (this.actor.input.down) this.actor.anim?.reverseClip(this.name)
  }

  update(delta) {
    const { actor } = this

    actor.updateMove(delta)
    actor.updateTurn(delta)
    actor.updateStrafe(delta)
  }

  exit() {
    this.actor.anim?.resetSpeed(this.name)
  }
}
