import { isDev } from '/config.js'

export default class State {
  constructor(actor, name) {
    this.actor = actor
    this.name = name
    this.prevState = ''
    this.last = Date.now() // for ai intervals
  }

  get action() {
    return this.actor.anim?.getAction(this.name)
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
    if (isDev && this.actor.name == 'player') console.log('State enter:', this.name, this.action)

    this.prevState = oldState?.name
    if (this.action) this.action.enabled = true
  }

  update(delta) {}

  exit() {}

  /* ANIM HELPERS */

  transitFrom(oldName, duration) {
    return this.actor.anim?.transitFrom(oldName, this.name, duration)
  }
}