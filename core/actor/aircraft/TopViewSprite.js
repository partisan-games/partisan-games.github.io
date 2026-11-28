import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'

/** How far below a plane at its height its shadow falls, in pixels, and how big it looks on the ground. */
const shadowOffset = 10
const groundScale = .75

/**
 * The view of a plane seen from above, its picture pointing up the view: turned the way the body flies, with its
 * shadow on the sea, smaller and nearer its shadow the lower a landing body flies (`lift`), shrinking as it falls once
 * shot down, and its fire. A subclass may set `alpha` for a blink and draw over it in `drawOver(ctx)`.
 */
export default class TopViewSprite extends BodySprite {
  constructor(body, src, options) {
    super(body, src, { ...options, flammable: true })
    this.alpha = 1
    this.fallScale = 1
  }

  /** Its span across the view and its length down it; the picture points up the view, a quarter turn from yaw 0. */
  fit() {
    super.fit()
    this.width = this.projection.length(this.body.size.width)
    this.height = this.projection.length(this.body.size.length)
    this.angle = this.projection.angle(this.body.yaw) + Math.PI / 2
  }

  /** Its rounds, made the first time each is seen. */
  syncRounds(pool) {
    this.syncViews(pool.projectiles, round => new BulletSprite(round, this.projection))
  }

  update(dt) {
    super.update(dt)
    this.fallScale = this.body.dead ? this.fallScale * .8 ** dt : 1
  }

  drawOver() {}

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.globalAlpha *= this.alpha
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    const lift = this.body.lift ?? 1, scale = this.fallScale * (groundScale + (1 - groundScale) * lift)
    ctx.scale(this.scaleX * scale, this.scaleY * scale)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowOffsetX = ctx.shadowOffsetY = shadowOffset * lift
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.shadowColor = 'transparent'
    this.drawOver(ctx)
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
