/** Flies a warplane from a player's input, which the scene makes: the arrows move it across and up, attack fires. */
export default class WarplaneKeys {
  constructor(body, input) {
    this.body = body
    this.input = input
  }

  update() {
    const { body, input } = this
    const way = (more, less) => (more ? 1 : 0) - (less ? 1 : 0)
    body.steer({ across: way(input.right, input.left), climb: way(input.up, input.down) })
    if (input.attack) body.fire()
  }

  end() {
    this.input.end?.()
  }
}
