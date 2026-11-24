import GameObject2D from '/core/actor/GameObject2D.js'
import { ctx } from '/core/io/canvas2d.js'

/** The partisan seen from above, its uniform's colour, and the colours of the others aboard. */
const figure = { src: 'game-ready/vojnici/partizan-odozgo.png', size: [32, 36], drawn: [24, 27] }
const uniform = [101, 115, 73]
const uniforms = [uniform, [123, 128, 119], [119, 99, 75], [94, 110, 108]]

/**
 * The seats aboard, as shares of the boat's length ahead of its middle and of its width across, and the way each one
 * faces, in radians from the bow.
 */
const seats = [[-.075, -.17, -.8], [.075, -.17, .65], [-.075, .17, -1.65], [.075, .17, 1.5]]

/** A copy of the figure in uniform `color`, its cap and other details untouched. */
function inUniform(image, color) {
  const canvas = document.createElement('canvas')
  ;[canvas.width, canvas.height] = figure.size
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, ...figure.size)
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (uniform.some((value, i) => pixels.data[offset + i] !== value)) continue
    pixels.data.set(color, offset)
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

/**
 * The partisans aboard the boat drawn by `view`, each a little different. They sit in place unless a landing moves
 * them: `placeOf(i, seat)` gives where one stands and the way he faces, from where he sits.
 */
export default class Passengers {
  constructor({ view, random = Math.random }) {
    this.view = view
    this.layer = new GameObject2D(figure.src, { z: -3, width: figure.drawn[0], height: figure.drawn[1] })
    this.layer.render = () => this.render()
    this.layer.onload = () => {
      this.uniforms = uniforms.map(color => inUniform(this.layer.image, color))
    }
    this.uniforms = []
    this.placeOf = (i, seat) => seat
    this.looks = seats.map(() => ({
      scale: .9 + random() * .2, lean: (random() - .5) * .35, turn: (random() - .5) * .4,
      offsetX: (random() - .5) * 3, offsetY: (random() - .5) * 3,
    }))
  }

  /** Where passenger `i` sits on screen, and the way he faces. */
  seat(i) {
    const { view } = this
    const [along, across, facing] = seats[i], look = this.looks[i]
    const x = along * view.width + look.offsetX, y = across * view.height + look.offsetY
    return {
      x: view.x + Math.cos(view.angle) * x - Math.sin(view.angle) * y,
      y: view.y + Math.sin(view.angle) * x + Math.cos(view.angle) * y,
      // the source faces northwest; seated, they face the bow, turned as their seat has it
      angle: view.angle + Math.PI * .75 + facing + look.turn,
    }
  }

  render() {
    if (!this.uniforms.length || !this.view.visible) return
    const [width, height] = figure.drawn
    seats.forEach((_, i) => {
      const { x, y, angle } = this.placeOf(i, this.seat(i))
      const look = this.looks[i]
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle + look.lean)
      ctx.scale(look.scale, look.scale)
      ctx.drawImage(this.uniforms[i], -width / 2, -height / 2, width, height)
      ctx.restore()
    })
  }
}
