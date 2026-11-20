import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import Zastava from './Zastava.js'
import artFrame from './artFrame.js'
import ustanakArt from '/core/actor/ustanakArt.js'

export default class Zastavnik extends Sprite {
  constructor(x, y, { italian = false, flagTime } = {}) {
    const art = italian ? ustanakArt.italianBearer : ustanakArt.partisanBearer
    super(art.src, {
      x, y, width: art.width, height: art.height, names: art.names, frameCount: art.columns,
      defaultAnimation: art.defaultAnimation, animationTime: art.durations[art.defaultAnimation],
    })
    this.art = art
    this.direction = italian ? -1 : 1
    this.poleX = x + 19 * this.direction
    this.baseY = y
    this.flag = new Zastava({ x: this.poleX, y: y - 105, italian, getTime: flagTime })
    this.children.push(this.flag)
  }

  standAt(depth) {
    this.y = this.baseY + depth
    this.flag.y = this.baseY - 105 + depth
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
    artFrame(this, { footOffset: this.art.footOffset, baseline: this.art.baseline, direction: this.direction })
  }
}
