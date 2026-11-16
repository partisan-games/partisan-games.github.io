import Vector from '/core/Vector.js'

export const layers = Object.freeze({ background: 10, ground: -.5, unit: -1, projectile: -2, effect: -3 })

class FlameLayer {
  constructor(owner) {
    this.owner = owner
    this.position = new Vector(0, 0, layers.effect)
  }

  render() {
    if (this.owner.shown && this.owner.burning)
      this.owner.flame.render(this.owner.smoky)
  }
}

/** Scenery stays behind units; shots and effects stay in front of all unit parts. */
export default class CombatLayers {
  constructor(units) {
    this.units = units
    for (const unit of units) {
      unit.flameLayer = new FlameLayer(unit)
      unit.children.push(unit.flameLayer)
    }
    this.update()
  }

  update() {
    for (const unit of this.units) {
      unit.position.z = layers.unit
      for (const barrel of [unit.cev, unit.barrel])
        if (barrel) barrel.position.z = layers.unit

      const pool = unit.granate || unit.fire?.projectiles
      for (const projectile of pool?.projectiles || []) {
        projectile.position.z = layers.projectile
        for (const effect of projectile.children || []) effect.position.z = layers.effect
      }
    }
  }
}
