import SideVehicle from '/core/actor/SideVehicle.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import WorldRocket, { inheritVelocity } from './WorldRocket.js'
import { outsideView } from './view.js'

/** The stretch of the screen the vehicle patrols, in pixels from its left edge. */
const patrol = { left: 150, right: 600, speed: 120 }

/**
 * The enemy vehicle keeps pace with the plane and patrols the same stretch of the screen as before the camera.
 * Fixed targets on the ground replace it later (PLAN-KLUZ FK-07).
 */
export default class Hummel extends SideVehicle {
  constructor({ camera, pace, groundY, session }) {
    super('armies/hummel.png', { x: patrol.left, y: groundY, scale: .75, session })
    this.camera = camera
    this.pace = pace
    this.direction = 1
    this.bullets = new ProjectilePool({ owner: this, create: () => new WorldRocket(camera), onFire: inheritVelocity(this) })
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  patrol() {
    if (this.dead) return
    const screenX = this.x - this.camera.cameraX
    if (screenX <= patrol.left) this.direction = 1
    if (screenX >= patrol.right) this.direction = -1
    this.dx = this.direction * patrol.speed + this.pace()
    this.dy = 0
    // Facing left is a half turn plus a vertical flip, as SideVehicle draws it.
    this.angle = this.direction === 1 ? 0 : Math.PI
    this.flipX = this.direction
  }
}
