import Body from '/core/gameplay/bodies/Body.js'

/** The player's stand-in for a block in metres: it takes hits, never dies and has no role. */
export default class Dummy extends Body {
  takeHit() {
    this.hitsTaken++
    return false
  }
}
