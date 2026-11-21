/** The kinds of attack a key can start, in the order they are checked. */
const attacks = ['attack', 'attack2', 'special']

/**
 * Leads a character from a player's input, which the scene makes: the arrows walk and turn it, run makes it run,
 * the side keys step it aside, jump jumps and the attack keys swing; a joystick's `screen.forward` walks it too.
 */
export default class CharacterKeys {
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
    const kind = attacks.find(name => input[name])
    if (kind) body.attack(kind)
  }

  end() {
    this.input.end?.()
  }
}
