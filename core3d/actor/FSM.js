import StateMachine from '/core/gameplay/StateMachine.js'
import { getPlayerState } from './states/index.js'
import { getAIState } from './states/ai/index.js'

/**
 * A 3D actor's states on the shared state machine. Any name is a state: the class that plays it is chosen as the actor
 * enters it, for a player or an AI and by its jump and attack styles, and a name without its own class plays its
 * animation once. Each state learns the one before it and that one's animation, to blend from it.
 */
export default class FSM {
  constructor(actor, baseState) {
    this.actor = actor
    /** The state class playing now. */
    this.currentState = null
    this.machine = new StateMachine(actor, { [baseState]: this.entry(baseState) }, baseState)
  }

  get action() {
    return this.currentState.action
  }

  get stateName() {
    return this.machine.name
  }

  chooseState(name) {
    return this.actor.name === 'player'
      ? getPlayerState(name, this.actor.jumpStyle, this.actor.attackStyle)
      : getAIState(name, this.actor.jumpStyle, this.actor.attackStyle)
  }

  /** The shared machine's state for `name`, which plays it with a new instance of its class. */
  entry(name) {
    return {
      enter: actor => {
        const oldState = this.currentState
        this.currentState = new (this.chooseState(name))(actor, name)
        this.currentState.enter(oldState, oldState?.action)
      },
      update: (actor, delta) => this.currentState.update(delta),
      exit: () => this.currentState.exit(),
    }
  }

  setState(name) {
    this.machine.states[name] ??= this.entry(name)
    this.machine.set(name)
  }

  update(delta) {
    this.machine.update(delta)
  }
}
