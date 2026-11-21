import GameObject2D from '/core/actor/GameObject2D.js'

const spatter = { frames: 8, seconds: .4 }

/** Airborne drops descend to a flat stain; only the stain remains below the fallen actor. */
export default class FallingBlood extends GameObject2D {
  constructor({ fallTime }) {
    super('sprites/efekti/krv-mala.png', { width: 64, height: 64, visible: false })
    this.fallTime = fallTime
    this.layer = -2
    this.stain = new GameObject2D('armies/game-ready/scenery/blood-pool.png', { width: 1, height: 1, visible: false })
    this.stain.layer = 0
    this.children.push(this.stain)
  }

  start({ x, y, groundX = x, groundY, width, height }) {
    this.setPosition(x, y)
    this.startY = y
    this.groundX = groundX
    this.groundY = groundY
    this.age = 0
    this.width = this.height = Math.min(width, height) * .85
    // The flat corpse covers a small pool completely; keep a visible rim around it.
    this.stain.width = width * 1.1
    this.stain.height = height * .6
    this.stain.hide()
    this.show()
    this.update(0)
  }

  update(dt) {
    if (!this.visible) return
    this.age = Math.min(this.age + dt, this.fallTime)
    const progress = this.age / this.fallTime
    // By the end even the highest drop has crossed the contact plane.
    this.y = this.startY + (this.groundY + this.height / 2 - this.startY) * progress ** 2
    const landed = Math.min(1, Math.max(0, (this.y + this.height / 2 - this.groundY) / this.height))
    this.stain.scaleX = this.stain.scaleY = Math.sqrt(landed)
    // The existing pool's ground anchor is y=40 in its 48px source image.
    this.stain.setPosition(this.groundX, this.groundY - this.stain.height / 3 * this.stain.scaleY)
    this.stain.visible = landed > 0
    if (progress === 1) this.hide()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const frameWidth = this.image.naturalWidth / spatter.frames
    const frame = Math.min(spatter.frames - 1, Math.floor(this.age / spatter.seconds * spatter.frames))
    const left = this.x - this.width / 2, top = this.y - this.height / 2
    ctx.save()
    ctx.beginPath()
    ctx.rect(left, top, this.width, Math.max(0, Math.min(this.height, this.groundY - top)))
    ctx.clip()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, frame * frameWidth, 0, frameWidth, this.image.naturalHeight,
      left, top, this.width, this.height)
    ctx.restore()
  }
}
