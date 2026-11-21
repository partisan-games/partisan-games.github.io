import StandingSprite from '/core/actor/StandingSprite.js'
import ustanakArt from '/core/actor/ustanakArt.js'
import Flag from './Flag.js'

/**
 * Where the pole stands ahead of the bearer's middle, how high it reaches above his feet, and where its flag hangs,
 * in pixels of the picture as drawn.
 */
const pole = { ahead: 19, top: 143, flag: 140 }

/**
 * How a flag bearer looks, partisan or `italian`: standing with his pole, its flag waving on `flagTime()`, the
 * presentation time the flags of a battle share. It only reads the body.
 */
export default class FlagBearerSprite extends StandingSprite {
  constructor(body, { italian = false, flagTime, projection, camera }) {
    super(body, italian ? ustanakArt.italianBearer : ustanakArt.partisanBearer, { projection, camera })
    this.flag = new Flag({ x: 0, y: 0, italian, getTime: flagTime })
    this.children.push(this.flag)
    this.update(0)
  }

  get poleX() {
    return this.x + pole.ahead * this.flipY
  }

  update(dt) {
    super.update(dt)
    if (!this.flag) return
    this.clipTime = this.body.stateTime
    this.flag.setPosition(this.poleX, this.y + this.height / 2 - pole.flag)
  }

  render(ctx) {
    if (!this.shown) return
    const feet = this.y + this.height / 2
    ctx.save()
    ctx.strokeStyle = '#51422e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.poleX, feet)
    ctx.lineTo(this.poleX, feet - pole.top)
    ctx.stroke()
    ctx.restore()
    super.render(ctx)
  }
}
