/**
 * Flies a warplane from a player's input, which the scene makes: the arrows move it across and up, attack fires its
 * missiles, and the second attack holds the fire of its `guns`, if it has them.
 */
export default class WarplaneKeys {
  constructor(body, input, guns = null) {
    this.body = body
    this.input = input
    this.guns = guns
  }

  update() {
    const { body, input, guns } = this
    const way = (more, less) => (more ? 1 : 0) - (less ? 1 : 0)
    body.steer({ across: way(input.right, input.left), climb: way(input.up, input.down) })
    if (input.attack) body.fire()
    if (guns) guns.firing = !body.landing && Boolean(input.attack2)
  }

  end() {
    this.input.end?.()
  }
}
