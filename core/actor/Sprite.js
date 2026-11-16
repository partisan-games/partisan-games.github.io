import GameObject2D from './GameObject2D.js'
import { ctx } from '../io/canvas2d.js'

class Animation {
  constructor(name, frameCount, startFrame, frameWidth, frameHeight, loop = true) {
    this.name = name
    this.frameCount = frameCount
    this.startFrame = startFrame
    this.width = frameWidth
    this.height = frameHeight
    this.loop = loop
  }
}

/**
 * frameCount: a number, or one number per animation when their lengths differ
 */
export default class Sprite extends GameObject2D {
  constructor(src, { names, frameCount, defaultAnimation, animationTime = .5, ...rest }) {
    super(src, rest)
    this.animation = null
    this.animationName = ''
    this.animationTime = animationTime // sekundi
    this.animationElapsed = 0
    this.names = names
    this.frameCount = frameCount
    this.defaultAnimation = defaultAnimation
  }

  onload() {
    this.animations = this.createAnimations(this.names, this.frameCount)
    if (this.defaultAnimation) this.setAnimation(this.defaultAnimation)
  }

  createAnimations(names, duzine) {
    const brojKolona = duzine.length ? Math.max(...duzine) : duzine
    const width = this.image.naturalWidth / brojKolona
    const height = this.image.naturalHeight / names.length
    return names.map((name, i) => {
      const frameCount = duzine[i] || duzine
      return new Animation(name, frameCount, i * frameCount, width, height)
    })
  }

  reset() {
    this.animationElapsed = 0
  }

  setAnimation(name, loop) {
    if (!this.animations) return
    if (this.animation?.name !== name) this.reset()

    this.animation = this.animations.find(anim => anim.name === name)
    if (loop !== undefined) this.animation.loop = loop
  }

  animationFinished(dt) {
    return this.animationElapsed + dt >= this.animationTime
  }

  update(dt) {
    super.update(dt)
    if (!this.animation) return

    if (this.animation.loop || !this.animationFinished(dt))
      this.animationElapsed += dt
  }

  drawFrame() {
    if (!this.animation) return

    const { startFrame, width, height, frameCount } = this.animation

    const duzinaKadra = this.animationTime / frameCount
    const trenutniKadar = Math.floor((this.animationElapsed % this.animationTime) / duzinaKadra)
    const trenutniRed = Math.floor((startFrame + trenutniKadar) / frameCount)
    const trenutnaKolona = (startFrame + trenutniKadar) - (trenutniRed * Math.floor(frameCount))
    const slikaX = trenutnaKolona * width
    const slikaY = trenutniRed * height

    ctx.drawImage(
      this.image, slikaX, slikaY, width, height, 0 - width / 2, 0 - height / 2, width, height
    )
  }

  render() {
    ctx.save()
    ctx.translate(this.x, this.y)
    this.drawFrame()
    ctx.restore()
  }
}
