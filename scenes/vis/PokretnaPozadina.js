import GameObject2D from '/core/actor/GameObject2D.js'

export default class PokretnaPozadina extends GameObject2D {

  constructor(speed = 10, width = window.innerWidth) {
    super('textures/okean.gif', { width, z: 2 })
    this.dx = 0
    this.dy = speed
  }

  onload() {
    this.setPosition(this.width / 2, 0)
  }

  checkBounds() {
    if (this.y > this.height / 2)
      this.y -= this.height / 2
  }
}
