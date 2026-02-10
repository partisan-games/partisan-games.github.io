import { getPlayerState } from './states/index.js'
import { getAIState } from './states/ai/index.js'

export default class FSM {
  constructor(actor, stateName) {
    this.actor = actor
    this.state = null
    this.setState(stateName)
  }

  get action() {
    return this.state.action
  }

  get stateName() {
    return this.state?.name
  }

  setState(name) {
    const oldState = this.state
    if (oldState) {
      if (oldState.name == name) return
      oldState.exit()
    }
    const State = this.actor.name === 'player'
      ? getPlayerState(name, this.actor.jumpStyle, this.actor.attackStyle)
      : getAIState(name, this.actor.jumpStyle, this.actor.attackStyle)

    this.state = new State(this.actor, name)
    this.state.enter(oldState, oldState?.action)
  }

  update(delta) {
    this.state.update(delta)
  }
}