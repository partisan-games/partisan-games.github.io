import WalkKeys from './WalkKeys.js'

/** The kinds of attack a key can start, in the order they are checked. */
const attacks = ['attack', 'attack2', 'special']

/** Leads a character from a player's input: it walks as `WalkKeys` walks it, and the attack keys swing. */
export default class CharacterKeys extends WalkKeys {
  update(dt) {
    super.update(dt)
    const { body, input } = this
    if (body.dead) return
    const kind = attacks.find(name => input[name])
    if (kind) body.attack(kind)
  }
}
