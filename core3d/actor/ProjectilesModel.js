import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * A tracer, as the guns of planes fire: an orange streak 6 m long and 0.24 m thick along its flight, as the eye sees a
 * burning round racing past, so a burst still shows a hundred metres off; behind it a trail `trailLength` metres long
 * fades out, so a burst swung across the sky shows its sweep. The haze does not fade them, and the toon renderer draws
 * them without an outline, so they do not swell into balls.
 */
const tracerMaterial = new THREE.MeshBasicMaterial({ color: 0xffa040, fog: false })
tracerMaterial.userData.outlineParameters = { visible: false }
export const trailLength = 25
const trailMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false })
trailMaterial.userData.outlineParameters = { visible: false }
const trailGeometry = new THREE.CylinderGeometry(.1, 0, trailLength, 5).rotateX(Math.PI / 2).translate(0, 0, -trailLength / 2)
{
  const { r, g, b } = tracerMaterial.color, { position } = trailGeometry.attributes, colors = []
  // opaque at the round, gone at the far end
  for (let i = 0; i < position.count; i++) colors.push(r, g, b, .6 * (1 + position.getZ(i) / trailLength))
  trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
}
const trail = new THREE.Mesh(trailGeometry, trailMaterial)
trail.name = 'trail'
export const tracerMesh = new THREE.Group().add(
  new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 6, 5).rotateX(Math.PI / 2), tracerMaterial), trail)
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
      if (!mesh.visible) continue
      const speed = Math.hypot(round.vx, round.vy, round.vz)
      mesh.lookAt(ahead.set(round.x + round.vx, round.y + round.vy, round.z + round.vz))
      // a trail reaches no further back than the muzzle
      const trail = mesh.getObjectByName('trail')
      if (trail) trail.scale.z = Math.max(.001, Math.min(1, speed * round.stateTime / trailLength))
    }
    if (shooter.shotsFired > this.firedSeen) this.shotSound?.play()
    this.firedSeen = shooter.shotsFired
  }

  end() {}
}
