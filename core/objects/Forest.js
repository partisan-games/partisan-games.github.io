import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'

export default class Forest extends GameObject2D {

  constructor(groundLevel = canvas2d.height, dx = 0) {
    super('nature/shumarak.png')
    this.groundLevel = groundLevel
    this.x = Math.random() * canvas2d.width
    this.dx = dx
  }

  onload() {
    this.placeOnGround(this.groundLevel + 5)
  }

  checkBounds() {
    this.reenterFromRight()
  }
}
