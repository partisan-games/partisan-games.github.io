import Flame from '/core/actor/Flame.js'

/** Preserve the original particle motion in the moving emitter's coordinate frame. */
export default class AttachedFlame extends Flame {
  constructor(x, y) {
    super(x, y, { reuseParticles: true })
    this.previousX = this.x
    this.previousY = this.y
  }

  update(dt) {
    const shiftX = this.x - this.previousX
    const shiftY = this.y - this.previousY
    // Move existing particles before emission so newborn particles are not shifted twice.
    for (const particle of this.sparks) {
      particle.x += shiftX
      particle.y += shiftY
    }
    super.update(dt)
    this.previousX = this.x
    this.previousY = this.y
  }
}
