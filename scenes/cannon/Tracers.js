import * as THREE from 'three'

/** A tracer round's speed, in metres a second, and its streak's length and thickness; a burst's rounds and their gap, in seconds. */
const tracer = { speed: 80, length: 1.5, thickness: .07, rounds: 5, gap: .09 }

const geometry = new THREE.BoxGeometry(tracer.thickness, tracer.thickness, tracer.length)
const material = new THREE.MeshBasicMaterial({ color: 0xffd27a })

/** Bursts of glowing rounds flying in `scene` from a slit to where they land, where `onLand(point)` raises dust. */
export default class Tracers {
  constructor(scene, onLand) {
    Object.assign(this, { scene, onLand })
    this.rounds = []
  }

  /** A burst from `from` towards `to`, its rounds one after another. */
  burst(from, to, rounds = tracer.rounds) {
    const way = to.clone().sub(from)
    const distance = way.length()
    way.normalize()
    for (let i = 0; i < rounds; i++) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), way)
      mesh.visible = false
      this.scene.add(mesh)
      this.rounds.push({ mesh, from, way, distance, flown: -i * tracer.gap * tracer.speed })
    }
  }

  update(dt) {
    for (const round of this.rounds) {
      round.flown += tracer.speed * dt
      round.mesh.visible = round.flown > 0
      round.mesh.position.copy(round.from).addScaledVector(round.way, Math.min(round.flown, round.distance))
    }
    this.rounds.filter(round => round.flown >= round.distance).forEach(round => {
      this.onLand(round.mesh.position)
      this.remove(round)
    })
  }

  remove(round) {
    round.mesh.removeFromParent()
    this.rounds.splice(this.rounds.indexOf(round), 1)
  }

  end() {
    [...this.rounds].forEach(round => this.remove(round))
  }
}
