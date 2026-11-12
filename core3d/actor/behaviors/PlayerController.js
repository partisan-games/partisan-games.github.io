const actions = ['up', 'down', 'left', 'right', 'run', 'jump', 'attack', 'attack2', 'special', 'strafeLeft', 'strafeRight']

/** Translates a platform input into the same intent an AI can supply. */
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

  end() {
    this.source.end?.()
  }
}
