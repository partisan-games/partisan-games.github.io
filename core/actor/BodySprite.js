import GameObject2D from './GameObject2D.js'
import { outsideView } from './worldView.js'
import { bodyImage } from './wreckView.js'

/**
 * The 2D view of a body: its picture placed, sized and turned as the body is, through the scene's `projection`.
 * `facing` is the way the art points, 1 right or -1 left; the art is mirrored when the body faces the other way. In a
 * world with a `camera` (a scene with `cameraX` and `cameraY`) it is not drawn while outside the view. A subclass may
 * draw parts under and over the picture, turned and mirrored with it, in `drawUnder(ctx)` and `drawOver(ctx)`. It only
 * reads the body.
 */
export default class BodySprite extends GameObject2D {
  constructor(body, src, { projection, facing = 1, camera = null, ...options } = {}) {
    super(src, options)
    Object.assign(this, { body, projection, facing, camera })
    this.fit()
  }

  /** A loaded picture takes its own size; the view keeps the body's. */
  onload() {
    this.fit()
  }

  get offScreen() {
    return this.camera ? outsideView(this, this.camera) : false
  }

  /** Where the body is, how big and how turned, on the screen. */
  fit() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    this.width = projection.length(body.size.length)
    this.height = projection.length(body.size.height)
    const mirrored = projection.mirrored(body)
    // the art is mirrored only when the body faces the other way than it points, and then turned the other way
    this.flipY = (mirrored ? -1 : 1) * this.facing
    const angle = projection.angle(body.yaw, body.pitch)
    this.angle = mirrored ? angle - Math.PI : angle
    this.alive = body.alive
  }

  /** A view for each of `projectiles`, made by `create(projectile)` the first time it is seen. */
  syncViews(projectiles, create) {
    this.projectileViews ??= new Map()
    for (const projectile of projectiles) {
      if (this.projectileViews.has(projectile)) continue
      const view = create(projectile)
      this.projectileViews.set(projectile, view)
      this.children.push(view)
      this.audioScene?.attach(view)
    }
  }

  update(dt) {
    this.fit()
    this.updateFlame(dt)
  }

  drawUnder() {}

  drawOver() {}

  /** The picture, or its wreck once the body is destroyed, where `fit` put it, then its fire. */
  render(ctx) {
    if (!this.shown) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY * this.scaleX, this.flipX * this.scaleY)
    this.drawUnder(ctx)
    ctx.drawImage(bodyImage(this), -this.width / 2, -this.height / 2, this.width, this.height)
    this.drawOver(ctx)
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
