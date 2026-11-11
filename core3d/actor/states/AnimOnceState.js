import State from './State.js'

export default class AnimOnceState extends State {
  constructor(...args) {
    super(...args)
    this.onFinish = this.onFinish.bind(this)
  }

  enter(oldState, oldAction) {
    super.enter(oldState)
    if (this.name == 'death' && !this.action) return this.actor.fallDead()

    if (!this.action)
      return this.actor.setState(this.prevOrIdle)

    this.oldState = oldState

    this.actor.anim?.playAction(oldAction, this.name, this.onFinish)
  }

  onFinish(e) {
    if (e.action !== this.action) return // the mixer reports every action, also the one fading out
    this.actor.anim?.removeEventListener('finished', this.onFinish)
    if (this.name == 'death') return
    this.actor.setState(this.prevOrIdle)
  }

  exit() {
    this.actor.anim?.removeEventListener('finished', this.onFinish)
  }
}