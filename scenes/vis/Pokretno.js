import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'

export default class Pokretno extends GameObject2D {
  constructor(src, { thrust, faktorY = .5, ...rest }) {
    super(src, { ...rest })
    this.thrust = thrust
    this.faktorY = faktorY
    this.reset()
  }

  postaviBrzinu() {
    this.dy = this.thrust
    this.dx = 0
  }

  postaviPolozaj() {
    const x = Math.random() * canvas2d.width
    this.setPosition(x, -canvas2d.height * Math.random() * this.faktorY)
  }

  reset() {
    this.postaviBrzinu()
    this.postaviPolozaj()
  }

  checkBounds() {
    if (this.y > canvas2d.height + this.height) this.reset()
  }
}
