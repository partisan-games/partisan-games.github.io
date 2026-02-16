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

  findActiveAction(prevAction) {
    if (prevAction) return prevAction
    const { mixer } = this.actor

    const othersActive = mixer?._actions.filter(action => action.isRunning() && action !== this.action)
    const first = othersActive.shift()

    if (!first) mixer.stopAllAction()
    else othersActive.forEach(action => action.stop())

    return first
  }

  transitFrom(prevAction, duration = .25) {
    const oldAction = this.findActiveAction(prevAction)
    if (this.action === oldAction) return

    if (this.action && oldAction) this.action.crossFadeFrom(oldAction, duration)
    this.action?.play()
  }

  syncLegs() {
    const oldAction = this.actor.anim.actions[this.prevState]
    const ratio = this.action.getClip().duration / oldAction.getClip().duration
    this.action.time = oldAction.time * ratio
  }

  // https://gist.github.com/rtpHarry/2d41811d04825935039dfc075116d0ad
  reverseAction(action = this.action, timescale = -1) {
    if (!action) return
    if (action.time === 0)
      action.time = action.getClip().duration
    action.paused = false
    action.setEffectiveTimeScale(timescale)
  }
}