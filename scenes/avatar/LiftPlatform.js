import { Box3 } from 'three'
import Platform from '/core3d/objects/Platform.js'

/** An Avatar lift carries the body that stands on its top, before that body and its view update, and shoves one in its way. */
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
    const shift = this.position[this.axis] - before
    if (riding) player[this.axis] += shift
    else if (player?.alive && shift) this.shove(player, shift)
  }

  /** Moving into the player, the lift pushes it ahead; rising under it, the lift lifts it onto the deck. */
  shove(player, shift) {
    const { min, max } = this.bounds.setFromObject(this.mesh)
    const half = player.size.length / 2
    const inside = player.x + half > min.x && player.x - half < max.x && player.z + half > min.z && player.z - half < max.z
      && player.feet < max.y && player.feet + player.size.height > min.y
    if (!inside) return
    if (this.axis !== 'y') player[this.axis] = shift > 0 ? max[this.axis] + half : min[this.axis] - half
    else if (shift > 0) player.y += max.y - player.feet
  }
}
