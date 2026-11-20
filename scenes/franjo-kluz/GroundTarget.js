import { outsideView } from './view.js'
import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'

/**
 * An enemy standing on the ground at a fixed place in the world. Bullets wear down its `health`; a bomb destroys it
 * at once. A vehicle burns where it was destroyed; a soldier plays its fall and stays down.
 */
export default class GroundTarget extends Sprite {
  /** `mirrored` turns a picture drawn facing right towards the plane, which comes from the left. */
  constructor({ src, art, size, health, vehicle, mirrored = false, camera, groundY, x, scale = .75 }) {
    // the renderer mirrors left to right by `flipY`
    super(art?.src || src, {
      x, scale, flammable: vehicle, flipY: mirrored ? -1 : 1,
      width: size && size[0] * scale, height: size && size[1] * scale,
      names: art ? Object.keys(art.clips) : ['idle'], frameCount: art?.columns || 1,
      defaultAnimation: 'idle', animationTime: art?.clips.idle.seconds || 1.4,
    })
    this.art = art
    this.pose = 'idle'
    this.tags.add('neprijatelj')
    this.health = health
    this.vehicle = vehicle
    this.camera = camera
    this.groundY = groundY
  }

  onload() {
    super.onload()
    this.placeOnGround(this.groundY)
    this.play(this.pose)
  }

  play(name) {
    const clip = this.art?.clips[name]
    if (this.art && !clip) return
    this.pose = name
    this.animationTime = clip?.seconds || 1.4
    this.setAnimation(name, clip?.loop ?? true)
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  takeHit(damage) {
    if (this.dead) return
    this.health -= damage
    if (this.health <= 0) this.die()
  }

  die() {
    if (this.dead) return
    super.die()
    if (this.vehicle) this.play('idle')
    else if (this.art) this.play('death')
    else this.hide()
  }

  update(dt) {
    if (this.dead && this.vehicle) {
      this.updateFlame(dt)
      return
    }
    const elapsed = this.animationElapsed
    super.update(dt)
    // A long frame must finish a one-shot too; Sprite otherwise stops before adding that frame's dt.
    if (this.animation && !this.animation.loop)
      this.animationElapsed = Math.min(this.animationTime, elapsed + dt)
  }

  /** How many world pixels one pixel of an atlas cell is: the drawn body fills the collider, standing on its anchor. */
  get artScale() {
    const [left, top, right] = this.art.body
    return Math.min(this.width / (right - left), this.height / (this.art.anchor.y - top))
  }

  /** The world point of a pixel of an atlas cell, such as a muzzle, as drawn now, mirrored or not. */
  framePoint({ x, y }) {
    const [left, , right] = this.art.body
    const scale = this.artScale
    return {
      x: this.x + (x - (left + right) / 2) * scale * this.flipY * this.scaleX,
      y: this.y + this.height / 2 - (this.art.anchor.y - y) * scale,
    }
  }

  drawFrame() {
    if (!this.animation) return
    const { width, height, frameCount, startFrame, loop } = this.animation
    const elapsed = loop ? this.animationElapsed % this.animationTime : this.animationElapsed
    const frame = Math.min(frameCount - 1, Math.floor(elapsed / this.animationTime * frameCount))
    let x = -this.width / 2, y = -this.height / 2, drawWidth = this.width, drawHeight = this.height
    if (this.art) {
      const [left, , right] = this.art.body
      const scale = this.artScale
      x = -(left + right) / 2 * scale
      y = this.height / 2 - this.art.anchor.y * scale
      drawWidth = width * scale
      drawHeight = height * scale
    }
    ctx.drawImage(this.image, frame * width, startFrame / frameCount * height, width, height, x, y, drawWidth, drawHeight)
  }

  render() {
    if (!this.shown || !this.animation) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY * this.scaleX, this.flipX * this.scaleY)
    ctx.imageSmoothingEnabled = false
    this.drawFrame()
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
