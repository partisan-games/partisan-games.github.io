import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import CombatLife from './CombatLife.js'

/** Sprite adapter for the boat game's future combat targets; does not spawn enemies. */
export default class CombatTarget extends GameObject2D {
  constructor({ session, viewLeft, maximum = 40, src, ...sprite }) {
    super(src, sprite)
    this.viewLeft = viewLeft
    this.combatLife = new CombatLife({ session, maximum, onDeath: () => this.stop() })
  }

  get alive() {
    return this.combatLife?.health.alive ?? true
  }
  set alive(value) {
    if (!this.combatLife) return
    if (!value) this.die()
    else if (this.dead) this.reset()
  }
  get lifeId() {
    return this.combatLife.lifeId
  }
  get energija() {
    return this.combatLife.health.current
  }

  get shown() {
    const x = this.x - this.viewLeft()
    return this.visible && x + this.diagonal / 2 >= 0 && x - this.diagonal / 2 <= canvas2d.width &&
      this.y + this.diagonal / 2 >= 0 && this.y - this.diagonal / 2 <= canvas2d.height
  }

  takeHit(damage, lifeId = this.lifeId) {
    return this.combatLife.damage(damage, lifeId)
  }

  die() {
    return this.takeHit(this.energija)
  }
  reset() {
    this.stop(); this.combatLife.reset()
  }
}
