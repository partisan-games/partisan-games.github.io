import Rocket from '/core/actor/projectiles/Rocket.js'
import { outsideView } from './view.js'

/** A rocket in world coordinates; it leaves play when it leaves the camera's view. */
export default class WorldRocket extends Rocket {
  constructor(camera) {
    super({ src: 'items/raketa.png', scale: .55 })
    this.camera = camera
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }
}

/** Rockets keep the shooter's own velocity, so they fly the same in every speed of the chase. */
export const inheritVelocity = shooter => ({ projectile }) => {
  projectile.dx += shooter.dx
  projectile.dy += shooter.dy
}
