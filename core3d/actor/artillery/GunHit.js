import { Box3, Group, Vector3 } from 'three'
import Particles from '/core3d/Particles.js'
import GunImpactCloud from './GunImpactCloud.js'

/**
 * Sparks fly off the front of the steel, and the gun is jolted back `jolt` metres, settling in `settle` seconds. The
 * sparks spread `rounds` steps, `step` seconds each, whatever the frame rate.
 */
export const gunHit = { jolt: .06, settle: .2, rounds: 6, step: 1 / 30 }

/**
 * How a hit on a field gun shows: sparks at a random point on the front of its `mesh`, which faces -z, and a short
 * jolt back. It only reads the body; added after the gun's model, it moves the mesh the model has just placed.
 * The catalog opts into shorter sparks with dust, metal chips and debris scaled to the gun's remaining health.
 */
export default class GunHit {
  constructor(body, mesh, { detailed = false } = {}) {
    Object.assign(this, { body, gun: mesh, seen: body.hitsTaken, joltLeft: 0, rounds: 0, elapsed: 0 })
    this.sparkRounds = detailed ? 3 : gunHit.rounds
    this.wasDead = body.dead
    this.sparks = new Particles({ num: detailed ? 24 : 60, size: detailed ? .025 : .04, unitAngle: .25, color: 0xffc860 })
    this.mesh = this.sparks.mesh
    if (detailed) {
      this.cloud = new GunImpactCloud()
      this.mesh = new Group()
      this.mesh.add(this.sparks.mesh, this.cloud.mesh)
    }
    this.mesh.visible = false
    // measured before the crew kneels beside it
    mesh.updateMatrixWorld(true)
    this.front = new Box3().setFromObject(mesh)
    this.front.applyMatrix4(mesh.matrixWorld.clone().invert())
  }

  /** A point on the front of the gun, in the scene. */
  impact() {
    const { min, max } = this.front
    const across = min.x + Math.random() * (max.x - min.x)
    const up = min.y + (.35 + Math.random() * .45) * (max.y - min.y)
    return this.gun.localToWorld(new Vector3(across * .6, up, min.z))
  }

  update(dt) {
    if (this.body.hitsTaken > this.seen || (this.cloud && this.body.dead && !this.wasDead)) {
      const point = this.impact()
      this.sparks.reset({ pos: point, unitAngle: this.cloud ? .07 : .25 })
      this.mesh.visible = true
      this.cloud?.start(point, this.body.health.current / this.body.health.maximum)
      this.joltLeft = gunHit.settle
      this.rounds = this.sparkRounds
      this.elapsed = 0
    }
    this.seen = this.body.hitsTaken
    this.wasDead = this.body.dead
    if (this.joltLeft > 0) {
      this.joltLeft = Math.max(0, this.joltLeft - dt)
      this.gun.translateZ(gunHit.jolt * this.joltLeft / gunHit.settle)
    }
    for (this.elapsed += dt; this.rounds && this.elapsed >= gunHit.step; this.elapsed -= gunHit.step, this.rounds--)
      this.sparks.expand({ velocity: 1.25, maxRounds: this.sparkRounds, gravity: .01 })
    if (!this.rounds) this.sparks.mesh.visible = false
    this.cloud?.update(dt)
    if (this.cloud) this.mesh.visible = this.sparks.mesh.visible || this.cloud.mesh.visible
  }

  end() {
    this.sparks.mesh.geometry.dispose()
    this.sparks.mesh.material.map?.dispose()
    this.sparks.mesh.material.dispose()
    this.cloud?.end()
    this.mesh.removeFromParent()
  }
}
