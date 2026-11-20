import GameObject2D from '/core/actor/GameObject2D.js'
import { canvas2d, ctx } from '/core/io/canvas2d.js'

export default class Baza extends GameObject2D {
  constructor({ speed, ...rest }) {
    super('vis.png', { x: 0, y: -canvas2d.height, z: 1, width: canvas2d.width, origin: 'GORE_LEVO', shadow: false, ...rest })
    this.korak = speed
  }

  /** It scrolls in until it fills the screen; once the plane takes off it scrolls on and away. */
  update(dt) {
    if (this.leaving || this.y + this.korak < 0)
      this.y += this.korak * dt
  }

  leave() {
    this.leaving = true
  }

  get gone() {
    return this.y > canvas2d.height
  }

  render() {
    ctx.drawImage(this.image, 0, this.y, this.width, this.height)
  }
}
