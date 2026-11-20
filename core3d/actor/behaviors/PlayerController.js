import { jumpStyles } from '/core3d/constants.js'

const actions = ['up', 'down', 'left', 'right', 'run', 'jump', 'attack', 'attack2', 'special', 'strafeLeft', 'strafeRight']

const moves = intent => intent.up || intent.down || intent.strafeLeft || intent.strafeRight

/**
 * The states a player's intent and body take it to from each state, checked in this order; every one that applies
 * is entered in turn, so the last one stays.
 */
const transitions = {
  idle: [
    [intent => intent.up || intent.down, 'walk'],
    [intent => intent.strafeLeft || intent.strafeRight, 'walk'],
    [(intent, actor) => actor.inAir, 'fall'],
    [(intent, actor) => intent.jump && actor.ableToJump, 'jump'],
    [intent => intent.attack, 'attack'],
    [intent => intent.attack2, 'attack2'],
    [intent => intent.special, 'special'],
  ],
  walk: [
    [(intent, actor) => intent.jump && actor.ableToJump, 'jump'],
    [(intent, actor) => actor.inAir, 'fall'],
    [intent => intent.attack, 'attack'],
    [intent => intent.attack2, 'attack2'],
    [intent => intent.run, 'run'],
    [intent => !moves(intent), 'idle'],
  ],
  run: [
    [(intent, actor) => intent.jump && actor.ableToJump, 'jump'],
    [(intent, actor) => actor.inAir, 'fall'],
    [intent => intent.attack, 'attack'],
    [intent => intent.attack2, 'attack2'],
    [intent => !intent.run, 'walk'],
    [intent => !moves(intent), 'idle'],
  ],
  fall: [
    [(intent, actor) => actor.jumpStyle === jumpStyles.FLY && intent.jump, 'jump'],
    [(intent, actor) => actor.onGround, 'idle'],
  ],
}

/** Translates a platform input into the same intent an AI can supply, and from it decides the player's state. */
export default class PlayerController {
  constructor(source) {
    this.source = source
    this.intent = { screen: {} }
    this.update()
  }

  update() {
    for (const action of actions) this.intent[action] = Boolean(this.source[action])
    this.intent.screen.forward = this.source.screen?.forward
    this.intent.pressed = this.source.pressed
    this.intent.controlsPressed = this.source.controlsPressed
    this.intent.keyPressed = this.source.keyPressed
  }

  /** Changes the state `actor` has just played this frame. */
  decide(actor) {
    for (const [applies, state] of transitions[actor.state] ?? [])
      if (applies(this.intent, actor)) actor.setState(state)
  }

  /** Whether a looping attack swings again once a swing ends. */
  repeatsAttack(name) {
    return this.intent[name]
  }

  end() {
    this.source.end?.()
  }
}
