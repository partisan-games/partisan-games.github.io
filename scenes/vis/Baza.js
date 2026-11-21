import GameObject2D from '/core/actor/GameObject2D.js'
import { canvas2d, ctx } from '/core/io/canvas2d.js'

/** Where the runway runs up the picture: across it, and its near end and the place a landed plane stands, down it. */
const runway = { x: .478, start: .76, stop: .6 }

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

  /** Whether it has scrolled in and stands still under the plane. */
  get arrived() {
    return !this.leaving && this.y + this.korak >= 0
  }

  /** The near end of the runway and the place a landed plane stands, on the screen. */
  get runway() {
    const point = share => ({ x: this.width * runway.x, y: this.y + this.height * share })
    return { start: point(runway.start), stop: point(runway.stop) }
  }

  get gone() {
    return this.y > canvas2d.height
  }

  render() {
    ctx.drawImage(this.image, 0, this.y, this.width, this.height)
  }
}
