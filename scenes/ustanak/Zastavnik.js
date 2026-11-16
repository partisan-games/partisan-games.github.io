import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import Zastava from './Zastava.js'
import artFrame from './artFrame.js'

export default class Zastavnik extends Sprite {
  constructor(x, y, { italian = false, flagTime } = {}) {
    super(`armies/game-ready/vojnici/${italian ? 'zastavnici' : 'partizanski-zastavnik'}-sprites.png`, {
      x, y, width: italian ? 80 : 60, height: 80, names: italian ? ['partisan', 'italian'] : ['partisan'], frameCount: 4,
      defaultAnimation: italian ? 'italian' : 'partisan', animationTime: 1.6,
    })
    this.direction = italian ? -1 : 1
    this.poleX = x + 19 * this.direction
    this.children.push(new Zastava({ x: this.poleX, y: y - 105, italian, getTime: flagTime }))
  }

  render() {
    ctx.save()
    ctx.strokeStyle = '#51422e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.poleX, this.y + 35)
    ctx.lineTo(this.poleX, this.y - 108)
    ctx.stroke()
    ctx.restore()
    super.render()
  }

  drawFrame() {
    artFrame(this, { footOffset: 35, direction: this.direction })
  }
}
