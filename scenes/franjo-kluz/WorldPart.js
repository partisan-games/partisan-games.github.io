import GameObject2D from '/core/actor/GameObject2D.js'
import { outsideView } from './view.js'

/** An image positioned by its owner in world coordinates, using the same camera for culling. */
export default class WorldPart extends GameObject2D {
  constructor(src, { camera, ...options }) {
    super(src, options)
    this.camera = camera
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }
}
