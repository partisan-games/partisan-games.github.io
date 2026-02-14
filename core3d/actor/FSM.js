import { getPlayerState } from './states/index.js'
import { getAIState } from './states/ai/index.js'

export default class FSM {
  constructor(actor, baseState) {
    this.actor = actor
    this.currentState = null
    this.setState(baseState)
  }

  get action() {
    return this.currentState.action
  }

  get stateName() {
    return this.currentState?.name
  }

  chooseState(name) {
    return this.actor.name === 'player'
      ? getPlayerState(name, this.actor.jumpStyle, this.actor.attackStyle)
      : getAIState(name, this.actor.jumpStyle, this.actor.attackStyle)
  }

  setState(name, chooseState) {
    const oldState = this.currentState
    if (oldState) {
      if (oldState.name == name) return
      oldState.exit()
    }
    const State = chooseState ? chooseState(name) : this.chooseState(name)
    console.log(State) // uvek IdleState

    this.currentState = new State(this.actor, name)
    this.currentState.enter(oldState, oldState?.action)
  }

  update(delta) {
    this.currentState.update(delta)
  }
}