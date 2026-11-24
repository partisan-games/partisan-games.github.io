import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'

/** A glowing tracer, as the guns of planes fire. */
export const tracerMesh = new THREE.Mesh(new THREE.SphereGeometry(.25), new THREE.MeshBasicMaterial({ color: 0xffd27a }))

/**
 * How the rounds of a `shooter` look and sound in 3D: a copy of `round` for each of its rounds (`shooter.rounds`, a
 * projectile pool) where it flies, and `shotSound`, if given, from where the shooter is (`x`, `y`, `z`) each time it
 * fires (`shotsFired` grows). The meshes sit in its own group, which the scene adds; it only reads the shooter.
 */
export default class ProjectilesModel {
  constructor(shooter, { round = tracerMesh, shotSound = null } = {}) {
    this.shooter = shooter
    this.round = round
    this.mesh = new THREE.Group()
    this.rounds = []
    this.firedSeen = shooter.shotsFired
    this.origin = new THREE.Vector3()
    const getPosition = () => this.origin.set(shooter.x, shooter.y, shooter.z)
    this.shotSound = shotSound && new Sound(shotSound, { profile: 'rifle', spatial: { getPosition } })
    this.sounds = this.shotSound ? [this.shotSound] : []
  }

  update() {
    const { shooter } = this
    for (const round of shooter.rounds.projectiles.slice(this.rounds.length)) {
      const mesh = this.round.clone()
      this.mesh.add(mesh)
      this.rounds.push({ round, mesh })
    }
    for (const { round, mesh } of this.rounds) {
      mesh.visible = round.state === 'flight'
      mesh.position.set(round.x, round.y, round.z)
    }
    if (shooter.shotsFired > this.firedSeen) this.shotSound?.play()
    this.firedSeen = shooter.shotsFired
  }

  end() {}
}
