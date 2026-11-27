/**
 * A German's view drawn where he hides: in a doorway, whole, or in an `opening` (screen pixels: `left`, `right`,
 * `top`, `bottom`, any of them open), seen only inside it, out of whose bottom he rises over `riseTime` seconds as he
 * appears. It shows and sounds through the view it wraps.
 */
export default class AmbushView {
  constructor(view, { opening = null, riseTime = .3 } = {}) {
    Object.assign(this, { view, riseTime })
    this.opening = opening && { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity, ...opening }
    this.shownTime = 0
    this.layer = 1
  }

  get sounds() {
    return this.view.sounds
  }

  get children() {
    return this.view.children
  }

  /** How much of his height is still below where he rises from. */
  get sunk() {
    return this.opening ? 1 - Math.min(1, this.shownTime / this.riseTime) : 0
  }

  /** Whether the screen point `x`, `y` is where he can be seen, in his opening or anywhere in a doorway. */
  seen(x, y) {
    const { opening } = this
    return !opening || (x > opening.left && x < opening.right && y > opening.top && y < opening.bottom)
  }

  update(dt) {
    this.shownTime += dt
    this.view.update(dt)
  }

  render(ctx, camera) {
    const { opening } = this
    if (!opening) return this.view.render(ctx, camera)
    const left = Math.max(opening.left, camera.x), right = Math.min(opening.right, camera.x + camera.width)
    const top = Math.max(opening.top, camera.y), bottom = Math.min(opening.bottom, camera.y + camera.height)
    if (right <= left || bottom <= top) return
    ctx.save()
    ctx.beginPath()
    ctx.rect(left, top, right - left, bottom - top)
    ctx.clip()
    ctx.translate(0, this.sunk * this.view.height)
    this.view.render(ctx, camera)
    ctx.restore()
  }
}
