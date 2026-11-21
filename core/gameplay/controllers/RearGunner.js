/**
 * The observer of a two-seat plane: he aims his gun at the nearest living one of `fighters` that he can fire back at,
 * or at none. Firing is the pilot's: the observer fires while the fire key is held. The body has `alive`, `x`, `y`,
 * `canFireBackAt(fighter)` and `aimBack(fighter)`; `fighters` is an array the scene keeps.
 */
export default class RearGunner {
  constructor(body, { fighters }) {
    this.body = body
    this.fighters = fighters
  }

  update() {
    const { body } = this
    const distance = fighter => Math.hypot(fighter.x - body.x, fighter.y - body.y)
    const target = body.alive && this.fighters
      .filter(fighter => fighter.alive && body.canFireBackAt(fighter))
      .reduce((nearest, fighter) => !nearest || distance(fighter) < distance(nearest) ? fighter : nearest, null)
    body.aimBack(target || null)
  }
}
