import GameObject2D from '/core/actor/GameObject2D.js'

/** The sea scrolling down under the aircraft: a picture of two same tiles, one above the other, as wide as the screen. */
export default class PokretnaPozadina extends GameObject2D {

  constructor(speed = 10, width = window.innerWidth, height = window.innerHeight) {
    super('textures/okean.gif', { width, z: 2 })
    this.screen = { width, height }
    this.dx = 0
    this.dy = speed
  }

  onload() {
    // on a screen taller than wide one tile, as wide as the screen, would not reach its bottom
    const grow = Math.max(1, this.screen.height / (this.height / 2))
    this.width *= grow
    this.height *= grow
    this.setPosition(this.screen.width / 2, 0)
  }

  checkBounds() {
    if (this.y > this.height / 2)
      this.y -= this.height / 2
  }
}
