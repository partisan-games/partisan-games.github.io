import { Box3 } from 'three'
import Platform from '/core3d/objects/Platform.js'

/** An Avatar lift carries the body that stands on its top, before that body and its view update. */
export default class LiftPlatform extends Platform {
  constructor({ getPlayer, ...options }) {
    super(options)
    this.getPlayer = getPlayer
    this.bounds = new Box3()
  }

  update(dt) {
    const player = this.getPlayer()
    this.bounds.setFromObject(this.mesh)
    const { min, max } = this.bounds
    const riding = player?.alive && player.vy <= 0 && !player.leap
      && Math.abs(player.feet - max.y) <= .03
      && player.x > min.x && player.x < max.x && player.z > min.z && player.z < max.z
    const before = this.position[this.axis]
    this.move(dt)
    this.mesh.updateMatrixWorld(true)
    if (riding) player[this.axis] += this.position[this.axis] - before
  }
}
