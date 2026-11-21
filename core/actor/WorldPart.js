import GameObject2D from '/core/actor/GameObject2D.js'
import { outsideView } from '/core/actor/worldView.js'

/**
 * An image positioned by its owner in world coordinates, using the same camera for culling; in a world without a
 * `camera` it is never culled, as the canvas edges say nothing about where the view is.
 */
export default class WorldPart extends GameObject2D {
  constructor(src, { camera = null, ...options } = {}) {
    super(src, options)
    this.camera = camera
  }

  get offScreen() {
    return this.camera ? outsideView(this, this.camera) : false
  }
}
