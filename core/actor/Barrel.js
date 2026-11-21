import GameObject2D from '/core/actor/GameObject2D.js'

/**
 * The separate barrel of a gun body, drawn from its pivot along the barrel's angle on the screen. `facing` is the way
 * the barrel art points, 1 right or -1 left, so its mouth is always away from the pivot; `crop` is the part of the
 * picture that is the barrel, all of it by default. Its middle line runs through the pivot. The body has
 * `barrelPivot`, `barrelLength`, `elevation` and `yaw`; the view that owns it has `body` and `projection`.
 */
export default class Barrel extends GameObject2D {
  constructor({ src, facing = 1, crop = null }, view) {
    super(src)
    Object.assign(this, { facing, crop, view })
  }

  render(ctx) {
    const { body, projection } = this.view
    if (!this.image.naturalWidth || body.dead || !this.view.shown) return
    const [sx, sy, sw, sh] = this.crop ?? [0, 0, this.image.naturalWidth, this.image.naturalHeight]
    const pivot = projection.point(body.barrelPivot)
    const length = projection.length(body.barrelLength)
    const thickness = length * sh / sw
    ctx.save()
    ctx.translate(pivot.x, pivot.y)
    ctx.rotate(projection.angle(body.yaw, body.elevation))
    // art pointing left is mirrored, so its mouth leads; it is never flipped upside down
    if (this.facing < 0) ctx.scale(-1, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, sx, sy, sw, sh, this.facing < 0 ? -length : 0, -thickness / 2, length, thickness)
    ctx.restore()
  }
}
