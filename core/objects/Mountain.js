import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'

export default class Mountain extends GameObject2D {

  constructor({ groundLevel = canvas2d.height, x = Math.random() * canvas2d.width, dx = 0, ...rest } = {}) {
    super ('nature/planine.png', { x, ...rest })
    this.dx = dx
    this.onload = () => this.placeOnGround(groundLevel + this.height * .05)
  }

  checkBounds() {
    this.wrapAround()
  }
}
