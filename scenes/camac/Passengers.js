import GameObject2D from '/core/actor/GameObject2D.js'
import { ctx } from '/core/io/canvas2d.js'

/** The partisan seen from above, as drawn. */
const figure = { src: 'game-ready/vojnici/partizan-odozgo.png', drawn: [24, 27] }

/**
 * The seats aboard, as shares of the boat's length ahead of its middle and of its width across, and the way each one
 * faces, in radians from the bow.
 */
const seats = [[-.075, -.17, -.8], [.075, -.17, .65], [-.075, .17, -1.65], [.075, .17, 1.5]]

/**
 * The partisans aboard the boat drawn by `view`, each sitting a little differently. They sit in place unless a landing moves
 * them: `placeOf(i, seat)` gives where one stands and the way he faces, from where he sits.
 */
export default class Passengers {
  constructor({ view, random = Math.random }) {
    this.view = view
    this.layer = new GameObject2D(figure.src, { z: -3, width: figure.drawn[0], height: figure.drawn[1] })
    this.layer.render = () => this.render()
    this.placeOf = (i, seat) => seat
    this.looks = seats.map(() => ({
      lean: (random() - .5) * .35, turn: (random() - .5) * .4,
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
    if (!this.layer.image.complete || !this.view.visible) return
    const [width, height] = figure.drawn
    seats.forEach((_, i) => {
      const { x, y, angle } = this.placeOf(i, this.seat(i))
      const look = this.looks[i]
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle + look.lean)
      ctx.drawImage(this.layer.image, -width / 2, -height / 2, width, height)
      ctx.restore()
    })
  }
}
