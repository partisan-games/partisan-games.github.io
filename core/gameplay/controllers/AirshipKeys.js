/**
 * Flies an airship from a player's input, which the scene makes: left and right turn it, up and down climb and sink,
 * and PageUp and PageDown speed it up and slow it down.
 */
export default class AirshipKeys {
  constructor(body, input) {
    this.body = body
    this.input = input
  }

  update() {
    const { input } = this
    const way = (more, less) => (more ? 1 : 0) - (less ? 1 : 0)
    this.body.steer({
      turn: way(input.left, input.right),
      climb: way(input.up, input.down),
      throttle: way(input.pressed?.PageUp, input.pressed?.PageDown),
    })
  }

  end() {
    this.input.end?.()
  }
}
