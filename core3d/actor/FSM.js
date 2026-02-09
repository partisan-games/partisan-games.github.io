import { getPlayerState } from './states/index.js'
import { getAIState } from './states/ai/index.js'

export default class FSM {
  constructor(actor, stateName) {
    this.actor = actor
    this.currentState = null
    this.setState(stateName)
  }

  get action() {
    return this.currentState.action
  }

  get state() {
    return this.currentState?.name
  }

  setState(name) {
    const oldState = this.currentState
    if (oldState) {
      if (oldState.name == name) return
      oldState.exit()
    }
    const State = this.actor.name === 'player'
      ? getPlayerState(name, this.actor.jumpStyle, this.actor.attackStyle)
      : getAIState(name, this.actor.jumpStyle, this.actor.attackStyle)

    this.currentState = new State(this.actor, name)
    this.currentState.enter(oldState, oldState?.action)
  }

  update(delta) {
    this.currentState.update(delta)
    // this.currentState?.update?.(delta)
  }
}