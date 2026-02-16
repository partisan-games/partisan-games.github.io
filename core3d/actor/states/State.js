export default class State {
  constructor(actor, name) {
    this.actor = actor
    this.name = name
    this.prevState = ''
    this.last = Date.now() // for ai intervals
  }

  get action() {
    if (!this.actor.anim) return null

    const { actions } = this.actor.anim
    if (this.actor === 'enemy' && this.name === 'attack')
      return actions.attack2
        ? Math.random() > .5 ? actions.attack : actions.attack2
        : actions.attack
    return actions[this.name]
  }

  get input() {
    return this.actor.input
  }

  get prevOrIdle() {
    if (this.prevState == 'pain') return 'idle' // bugfix
    return this.prevState || 'idle'
  }

  /* FSM */

  enter(oldState, oldAction) {
    // if (this.actor.name == 'player') console.log(this.name, this.action)
    this.prevState = oldState?.name
    if (this.action) this.action.enabled = true
  }

  update(delta) {}

  exit() {}

  /* ANIM HELPERS */

  transitFrom(prevAction, duration = .25) {
    const oldAction = this.actor.anim.findActiveAction(prevAction)
    if (this.action === oldAction) return

    if (this.action && oldAction) this.action.crossFadeFrom(oldAction, duration)
    this.action?.play()
  }
}