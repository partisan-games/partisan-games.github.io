import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * A tracer, as the guns of planes fire: a thin orange streak 2.5 m long along its flight, which the toon renderer
 * draws without an outline, so it does not swell into a ball.
 */
const tracerMaterial = new THREE.MeshBasicMaterial({ color: 0xff9a3c })
tracerMaterial.userData.outlineParameters = { visible: false }
export const tracerMesh = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.5, 5).rotateX(Math.PI / 2), tracerMaterial)
const ahead = new THREE.Vector3()

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
      // a streak lies along the way its round flies
      if (mesh.visible) mesh.lookAt(ahead.set(round.x + round.vx, round.y + round.vy, round.z + round.vz))
    }
    if (shooter.shotsFired > this.firedSeen) this.shotSound?.play()
    this.firedSeen = shooter.shotsFired
  }

  end() {}
}
