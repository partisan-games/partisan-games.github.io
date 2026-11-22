import { Explosion } from '/core3d/Particles.js'

/** How long a burst of fire lasts, in frames, and how fast it spreads each frame. */
const burst = { rounds: 30, spread: 1.12 }

/** Bursts of fire in `scene`, where shells explode; each fades and leaves the scene. */
export default class Blasts {
  constructor(scene) {
    this.scene = scene
    this.live = []
  }

  /** A burst at `point`, `size` big. */
  add(point, size) {
    const fire = new Explosion({ size })
    fire.reset({ pos: point, unitAngle: .1 * size })
    this.scene.add(fire.mesh)
    this.live.push(fire)
  }

  update() {
    this.live.forEach(fire => fire.expand({ velocity: burst.spread, maxRounds: burst.rounds }))
    this.live.filter(fire => !fire.mesh.visible).forEach(fire => this.remove(fire))
  }

  remove(fire) {
    fire.mesh.removeFromParent()
    fire.mesh.geometry.dispose()
    fire.mesh.material.dispose()
    this.live.splice(this.live.indexOf(fire), 1)
  }

  end() {
    [...this.live].forEach(fire => this.remove(fire))
  }
}
