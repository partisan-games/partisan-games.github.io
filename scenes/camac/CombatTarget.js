import Predmet from '/core/actor/Predmet.js'
import platno from '/core/io/platno.js'
import CombatLife from './CombatLife.js'

/** Sprite adapter for the boat game's future combat targets; does not spawn enemies. */
export default class CombatTarget extends Predmet {
  constructor({ session, viewLeft, maximum = 40, src, ...sprite }) {
    super(src, sprite)
    this.viewLeft = viewLeft
    this.combatLife = new CombatLife({ session, maximum, onDeath: () => this.stani() })
  }

  get alive() { return this.combatLife?.health.alive ?? true }
  set alive(value) {
    if (!this.combatLife) return
    if (!value) this.umri()
    else if (this.dead) this.reset()
  }
  get lifeId() { return this.combatLife.lifeId }
  get energija() { return this.combatLife.health.current }

  get prikazan() {
    const x = this.x - this.viewLeft()
    return this.vidljiv && x + this.dijagonala / 2 >= 0 && x - this.dijagonala / 2 <= platno.width &&
      this.y + this.dijagonala / 2 >= 0 && this.y - this.dijagonala / 2 <= platno.height
  }

  reagujNaPogodak(damage, lifeId = this.lifeId) {
    return this.combatLife.damage(damage, lifeId)
  }

  umri() { return this.reagujNaPogodak(this.energija) }
  reset() { this.stani(); this.combatLife.reset() }
}
