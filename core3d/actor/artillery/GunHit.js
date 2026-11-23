import { Box3, Vector3 } from 'three'
import Particles from '/core3d/Particles.js'

/**
 * Sparks fly off the front of the steel, and the gun is jolted back `jolt` metres, settling in `settle` seconds. The
 * sparks spread `rounds` steps, `step` seconds each, whatever the frame rate.
 */
export const gunHit = { jolt: .06, settle: .2, rounds: 6, step: 1 / 30 }

/**
 * How a hit on a field gun shows: sparks at a random point on the front of its `mesh`, which faces -z, and a short
 * jolt back. It only reads the body; added after the gun's model, it moves the mesh the model has just placed.
 */
export default class GunHit {
  constructor(body, mesh) {
    Object.assign(this, { body, gun: mesh, seen: body.hitsTaken, joltLeft: 0, rounds: 0, elapsed: 0 })
    this.sparks = new Particles({ num: 60, size: .04, unitAngle: .25, color: 0xffc860 })
    this.mesh = this.sparks.mesh
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
    if (this.body.hitsTaken > this.seen) {
      this.sparks.reset({ pos: this.impact(), unitAngle: .25 })
      this.joltLeft = gunHit.settle
      this.rounds = gunHit.rounds
      this.elapsed = 0
    }
    this.seen = this.body.hitsTaken
    if (this.joltLeft > 0) {
      this.joltLeft = Math.max(0, this.joltLeft - dt)
      this.gun.translateZ(gunHit.jolt * this.joltLeft / gunHit.settle)
    }
    for (this.elapsed += dt; this.rounds && this.elapsed >= gunHit.step; this.elapsed -= gunHit.step, this.rounds--)
      this.sparks.expand({ velocity: 1.25, maxRounds: gunHit.rounds, gravity: .01 })
    if (!this.rounds) this.mesh.visible = false
  }

  end() {
    this.mesh.geometry.dispose()
    this.mesh.material.map?.dispose()
    this.mesh.material.dispose()
    this.mesh.removeFromParent()
  }
}
