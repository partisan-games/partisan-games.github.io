import { Explosion } from '/core3d/Particles.js'

/** What a warplane shows without changing the game: turning propellers, smoke once it is hit, missile blasts. */
export default class WarplaneView {
  constructor(plane) {
    this.plane = plane
    this.explosion = new Explosion({ size: 4 })
    this.propellers = []
  }

  addPropeller(propeller) {
    const { plane } = this
    propeller.position.set(0, .63, -plane.depth * .5)
    plane.mesh.add(propeller)
    this.propellers.push(propeller)
  }

  /** Smoke trails from the first hit on. */
  showDamage() {
    if (this.smoke || this.loadingSmoke) return
    this.loadingSmoke = import('/core3d/Particles.js').then(({ Smoke }) => {
      const { plane } = this
      this.smoke = new Smoke()
      plane.add(this.smoke.mesh)
      this.smoke.mesh.position.y += plane.height * .4
      this.smoke.mesh.position.z += plane.depth * .4
    })
  }

  update(delta, t) {
    const { plane } = this
    this.smoke?.update(delta, t, { min: (plane.energy / 100) - 5 })
    this.explosion.expand({ velocity: 1.1, maxRounds: 30 })
    this.propellers.forEach(propeller => propeller.rotateZ(delta * -plane.speed))
  }
}
