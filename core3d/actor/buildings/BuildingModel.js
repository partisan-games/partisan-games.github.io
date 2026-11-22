import * as THREE from 'three'

const roundMesh = new THREE.Mesh(new THREE.SphereGeometry(.3), new THREE.MeshBasicMaterial({ color: 0x333333 }))

/**
 * How a building looks in 3D: its model standing on the ground where the body is, its `origin` that share of its height
 * above the ground; a factory's chimney smoking at `chimney`; burning once it is destroyed, or with `smokyChance`
 * smoking; and, for a tower, the rounds its gun fires. It only reads the body.
 */
export default class BuildingModel {
  constructor(body, { mesh, chimney = null, origin = 0, smokyChance = 0, random = Math.random }) {
    this.body = body
    this.mesh = mesh.clone()
    this.rounds = []
    this.seenAlive = body.alive
    import('/core3d/Particles.js').then(particles => {
      this.particles = particles
      if (!chimney) return
      this.chimney = new particles.BigSmoke()
      this.mesh.add(this.chimney.mesh)
      this.chimney.mesh.position.set(chimney[0], chimney[1], 0)
    })
    this.fireBelow = -body.size.height * (.75 + random() * .25)
    this.origin = origin
    this.smoky = random() < smokyChance
    this.place()
  }

  place() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.y - body.size.height * (.5 - this.origin), body.z)
  }

  /** A sphere for each round of the tower's gun, made the first time the gun has it. */
  syncRounds() {
    const rounds = this.body.rounds?.projectiles ?? []
    for (const round of rounds.slice(this.rounds.length)) {
      const mesh = roundMesh.clone()
      this.mesh.parent?.add(mesh)
      this.rounds.push({ round, mesh })
    }
    for (const { round, mesh } of this.rounds) {
      mesh.visible = round.state === 'flight'
      mesh.position.set(round.x, round.y, round.z)
    }
  }

  update(dt, t) {
    const { body, particles } = this
    this.place()
    if (body.dead && !this.fire && particles) {
      this.fire = this.smoky ? new particles.BigSmoke() : new particles.Fire()
      this.mesh.add(this.fire.mesh)
      this.fire.mesh.position.y += body.size.height * .5
    }
    this.fire?.update(dt, t, { min: this.fireBelow, max: 0 })
    this.chimney?.update(dt, t, { min: -body.size.height, max: 0 })
    this.syncRounds()
  }

  end() {
    this.rounds.forEach(({ mesh }) => mesh.removeFromParent())
  }
}
