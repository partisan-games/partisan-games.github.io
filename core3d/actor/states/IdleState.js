import State from './State.js'

const chooseDuration = prevState => {
  if (['run', 'flee', 'pursue'].includes(prevState)) return .75
  if (['jump', 'fall', 'attack', 'attack2'].includes(prevState)) return .25
  return .5
}

export default class IdleState extends State {
  enter(oldState, oldAction) {
    super.enter(oldState)
    if (this.action) this.transitFrom(oldAction, chooseDuration(oldState?.name))
  }

  update(delta) {
    this.actor.updateTurn(delta)
  }
}
