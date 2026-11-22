import BodySprite from './BodySprite.js'
import ArtClip from './ArtClip.js'

/**
 * The view of a body seen from above that walks or crawls, from an atlas `art` of a still row and a moving row of
 * `art.columns` frames: it plays the moving loop of `art.seconds` while the body goes faster than `still` metres a
 * second, turned the way the body heads. Its picture points along a yaw of 0 and spans the body's width.
 */
export default class LocomotionSprite extends BodySprite {
  constructor(body, { art, projection, camera, still = .025 }) {
    super(body, art.src, { projection, camera })
    Object.assign(this, { art, still })
    this.moving = false
    this.elapsed = 0
    if (art.death) {
      this.death = new ArtClip(art.death)
      this.children.push(this.death)
    }
  }

  fit() {
    super.fit()
    this.height = this.projection.length(this.body.size.width)
  }

  get frameIndex() {
    return this.moving ? Math.min(this.art.columns - 1, Math.floor(this.elapsed / this.art.seconds * this.art.columns)) : 0
  }

  update(dt) {
    super.update(dt)
    if (dt <= 0) return
    const { body } = this
    const moving = body.alive && Math.hypot(body.vx, body.vz) > this.still
    if (moving !== this.moving) this.elapsed = 0
    this.moving = moving
    if (moving) this.elapsed = (this.elapsed + dt) % this.art.seconds
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const { width, height } = this.art.frame
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.imageSmoothingEnabled = false
    if (!(this.body.dead && this.death?.draw(ctx, { name: 'dead', time: this.body.stateTime, x: 0, y: 0,
      scaleX: this.width / width, scaleY: this.height / height })))
      ctx.drawImage(this.image, this.frameIndex * width, this.moving ? height : 0, width, height,
        -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
