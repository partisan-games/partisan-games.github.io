import GameObject2D from '/core/actor/GameObject2D.js'
import { outsideView } from '/core/actor/worldView.js'

/** A building standing on the ground at a fixed place in the world. */
export default class WorldSprite extends GameObject2D {
  constructor(src, { camera, groundY, x }) {
    super(src, { x })
    this.camera = camera
    this.groundY = groundY
  }

  onload() {
    this.placeOnGround(this.groundY)
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }
}
