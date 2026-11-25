/**
 * Walks a character from a player's input, which the scene makes: the arrows walk and turn it, run makes it run, the
 * side keys step it aside and jump jumps; a joystick's `screen.forward` walks it too. Its attacks are another's to lead.
 */
export default class WalkKeys {
  constructor(body, input) {
    this.body = body
    this.input = input
  }

  update(dt) {
    const { body, input } = this
    if (body.dead) return
    const screen = input.screen?.forward
    const ahead = screen ? -screen : input.up ? 1 : input.down ? -1 : 0
    const side = (input.strafeRight ? 1 : 0) - (input.strafeLeft ? 1 : 0)
    const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    body.steer({ ahead, side, turn, running: Boolean(input.run) })
    if (input.jump) body.jump(dt)
  }

  end() {
    this.input.end?.()
  }
}
