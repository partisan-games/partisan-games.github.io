import { randomInRange } from '/core/utils.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'

export default class Bush extends GameObject2D {
  constructor(groundLevel = canvas2d.height, dx = 0) {
    super ('nature/zbun.png')
    this.dx = dx
    this.onload = () => this.randomAboveGround(groundLevel)
  }

  randomAboveGround(groundLevel) {
    this.setPosition(Math.random() * canvas2d.width, randomInRange(groundLevel - this.height / 2, canvas2d.height))
  }

  checkBounds() {
    this.reenterFromRight()
  }
}
