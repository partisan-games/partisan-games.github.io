import ArtClip from './ArtClip.js'
import art from './advanceArt.js'

export const advanceHeight = { rifleman: 1.72, gunner: 1.72, tank: 2.27, commander: .94 }

export default class AdvanceSprite {
  constructor(kind) {
    this.height = advanceHeight[kind]
    this.sheet = new ArtClip(art[kind])
    this.crew = kind === 'tank' ? new ArtClip(art.commander) : null
    this.children = this.crew ? [this.sheet, this.crew] : [this.sheet]
  }

  get worldWidth() {
    const { width, standingPixels } = this.sheet.art
    return width * this.height / standingPixels
  }

  draw(ctx, { name, time, x, y, scale, flip = 1, crewTime = time }) {
    const scaleX = scale * this.height / this.sheet.art.standingPixels
    this.sheet.draw(ctx, { name, time, x, y, scaleX, flip })
    this.crew?.draw(ctx, { name: 'idle', time: crewTime, x: x + flip * .55 * scale, y: y - 1.61 * scale,
      scaleX: scale * advanceHeight.commander / art.commander.standingPixels, flip })
  }

  /** Flash and drift start at the muzzle in the first firing cel, independently of later recoil. */
  drawShot(ctx, { name, age, x, y, scale, flip = 1 }) {
    if (age >= .42) return
    const muzzle = this.sheet.art.clips[name]?.muzzles?.[0]
    if (!muzzle) return
    const size = scale * this.height / this.sheet.art.standingPixels
    const muzzleX = x + flip * muzzle[0] * size
    const muzzleY = y + muzzle[1] * size
    ctx.save()
    if (age < .035) {
      ctx.fillStyle = '#e6d8ad'
      ctx.fillRect(Math.round(muzzleX), Math.round(muzzleY), Math.max(1, Math.round(scale * .055)), Math.max(1, Math.round(scale * .021)))
    }
    const smokeX = muzzleX + flip * age * scale * .36
    const smokeY = muzzleY - age * scale * .32
    const radius = scale * (.025 + age * .23)
    ctx.globalAlpha = (1 - age / .42) * .25
    const smoke = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, radius)
    smoke.addColorStop(0, '#bac0c9')
    smoke.addColorStop(1, '#bac0c900')
    ctx.fillStyle = smoke
    ctx.fillRect(smokeX - radius, smokeY - radius, radius * 2, radius * 2)
    ctx.restore()
  }
}
