import GameObject2D from '/core/actor/GameObject2D.js'

/**
 * How a flying round looks, drawn while it flies; `src` and `scale` are its picture. It points the way it moves on the
 * screen: where the camera follows its shooter, a round fired back from a fast plane barely moves over the ground, yet
 * flies back from the plane as seen.
 */
export default class BulletSprite extends GameObject2D {
  constructor(body, projection, { src = 'items/granata.gif', scale = .5 } = {}) {
    super(src, { scale, visible: false })
    this.body = body
    this.projection = projection
    /** Where it was last drawn on the screen, while it flies. */
    this.seen = null
  }

  /** It flies past the edge of the view until it falls out of play, so it is never left out for being off screen. */
  get offScreen() {
    return false
  }

  update() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    this.visible = body.state === 'flight'
    // until it has moved on the screen, it points the way it flies over the ground
    if (!this.visible) this.seen = null
    if (!this.seen) this.angle = projection.angle(body.yaw, body.pitch)
  }

  render(ctx, camera) {
    if (!this.shown) return
    const seen = { x: this.x - camera.x, y: this.y - camera.y }
    if (this.seen && (seen.x !== this.seen.x || seen.y !== this.seen.y))
      this.angle = Math.atan2(seen.y - this.seen.y, seen.x - this.seen.x)
    this.seen = seen
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
