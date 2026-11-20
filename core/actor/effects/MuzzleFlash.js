import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import { outsideView } from '/core/actor/worldView.js'
import spriteArt from '/core/actor/spriteArt.js'

const art = spriteArt['muzzle-flash']
const duration = art.clips.fire.seconds
const scale = .75

/** One flash anchored at the gun's muzzle; World advances it once with its owning gun. */
export default class MuzzleFlash extends Sprite {
  constructor(camera) {
    super(art.src, {
      names: ['fire'], frameCount: art.columns, defaultAnimation: 'fire', animationTime: duration,
      width: art.frame.width * scale, height: art.frame.height * scale, z: -1,
    })
    this.camera = camera
    this.age = 0
    this.hide()
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  start({ x, y }, angle) {
    this.setPosition(x, y)
    this.angle = angle
    this.age = 0
    this.reset()
    this.setAnimation('fire', false)
    this.show()
  }

  update(dt) {
    if (!this.visible) return
    super.update(dt)
    this.age += dt
    if (this.age >= duration) this.hide()
  }

  render() {
    if (!this.shown || !this.animation) return
    const { width, height } = art.frame
    const frame = Math.min(art.columns - 1, Math.floor(this.age / duration * art.columns))
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, frame * width, 0, width, height,
      -art.anchor.x * scale, -art.anchor.y * scale, width * scale, height * scale)
    ctx.restore()
  }
}
