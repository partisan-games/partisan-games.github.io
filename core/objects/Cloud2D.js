import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'

export default class Cloud2D extends GameObject2D {
  constructor(groundLevel = canvas2d.height, dx = 0) {
    super('nature/oblak.gif')
    this.groundLevel = groundLevel
    this.dx = dx
    this.dy = Math.random() * 20 - 10
  }

  onload() {
    this.setPosition(Math.random() * canvas2d.width, randomInRange(0, this.groundLevel))
  }

  checkBounds() {
    if (this.y < -100) {
      this.y = -100
      this.dy = -this.dy
    }
    if (this.y > this.groundLevel) {
      this.y = this.groundLevel
      this.dy = -this.dy
    }
    this.reenterFromRight()
  }
}
