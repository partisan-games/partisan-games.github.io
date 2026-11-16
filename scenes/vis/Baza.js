import GameObject2D from '/core/actor/GameObject2D.js'
import { canvas2d, ctx } from '/core/io/canvas2d.js'

export default class Baza extends GameObject2D {
  constructor({ speed, ...rest }) {
    super('vis.png', { x: 0, y: -canvas2d.height, z: 1, width: canvas2d.width, origin: 'GORE_LEVO', shadow: false, ...rest })
    this.korak = speed
  }

  update(dt) {
    if (this.y + this.korak < 0)
      this.y += this.korak * dt
  }

  render() {
    ctx.drawImage(this.image, 0, this.y, this.width, this.height)
  }
}
