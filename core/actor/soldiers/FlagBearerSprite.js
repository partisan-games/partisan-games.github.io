import StandingSprite from '/core/actor/StandingSprite.js'
import ustanakArt from '/core/actor/ustanakArt.js'
import Flag from './Flag.js'
import ArtClip from '/core/actor/ArtClip.js'

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
    this.actions = new ArtClip({
      src: `armies/game-ready/vojnici/${italian ? 'italian' : 'partisan'}-bearer-actions.png`,
      width: 128, height: 88, anchor: { x: 64, y: 80 },
      clips: { walk: { ms: [160, 160, 160, 160], loop: true }, dead: { row: 1, ms: [120, 160, 180, 240] } },
    })
    this.children.push(this.actions, this.flag)
    this.update(0)
  }

  get poleX() {
    return this.x + pole.ahead * this.flipY
  }

  update(dt) {
    super.update(dt)
    if (!this.flag) return
    this.clipTime = this.body.stateTime
    const progress = this.body.dead ? Math.min(1, this.body.stateTime / this.actions.seconds('dead')) : 0
    this.poleAngle = progress * progress * Math.PI / 2
    this.flag.settle = progress
    this.flag.way = this.flipY
    this.flag.setPosition(this.poleX + Math.sin(this.poleAngle) * pole.flag * this.flipY,
      this.y + this.height / 2 - Math.cos(this.poleAngle) * pole.flag - progress * 7)
  }

  render(ctx) {
    if (!this.shown) return
    const feet = this.y + this.height / 2
    ctx.save()
    ctx.strokeStyle = '#51422e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.poleX, feet)
    ctx.lineTo(this.poleX + Math.sin(this.poleAngle) * pole.top * this.flipY, feet - Math.cos(this.poleAngle) * pole.top)
    ctx.stroke()
    ctx.restore()
    if (this.body.state === 'idle' || !this.actions.draw(ctx, {
      name: this.body.dead ? 'dead' : 'walk', time: this.body.stateTime, x: this.x, y: feet,
      scaleX: this.height / 80, flip: this.flipY,
    })) super.render(ctx)
  }
}
