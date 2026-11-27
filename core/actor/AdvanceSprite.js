import ArtClip from './ArtClip.js'
import art from './advanceArt.js'
import spriteArt from './spriteArt.js'

export const advanceHeight = { rifleman: 1.72, gunner: 1.72, backpack: 1.72, officer: 1.72, tank: 2.27, t34: 2.72, commander: .94 }

const conditionClips = { damaged: { ms: [1000] }, dead: { ms: [1000], frameColumns: [1] } }
const flash = spriteArt['muzzle-flash']
const flashArt = { src: flash.src, ...flash.frame, anchor: flash.anchor, clips: { fire: { ms: [60, 60, 60, 60] } } }

export default class AdvanceSprite {
  constructor(kind) {
    this.height = advanceHeight[kind]
    const hull = art[kind]
    this.sheet = new ArtClip(hull)
    this.crew = kind === 'tank' ? new ArtClip(art.commander) : null
    this.damage = hull.conditionSrc && new ArtClip({ ...hull, src: hull.conditionSrc, clips: conditionClips })
    this.flash = kind === 'tank' ? new ArtClip(flashArt) : null
    this.children = [this.sheet, this.crew, this.damage, this.flash].filter(Boolean)
  }

  get worldWidth() {
    const { width, standingPixels } = this.sheet.art
    return width * this.height / standingPixels
  }

  draw(ctx, { name, time, x, y, scale, flip = 1, crewName = 'idle', crewTime = time, crewVisible = true, condition }) {
    const scaleX = scale * this.height / this.sheet.art.standingPixels
    const pose = { time, x, y, scaleX, flip }
    if (condition === 'dead') return this.damage.draw(ctx, { ...pose, name: condition })
    this.sheet.draw(ctx, { ...pose, name })
    if (condition === 'damaged') this.damage.draw(ctx, { ...pose, name: condition })
    if (this.crew && crewVisible) {
      const { crewAnchor, anchor } = this.sheet.art
      this.crew.draw(ctx, { name: crewName, time: crewTime,
        x: x + flip * (crewAnchor.x - anchor.x) * scaleX, y: y + (crewAnchor.y - anchor.y) * scaleX,
        scaleX: scale * advanceHeight.commander / art.commander.standingPixels, flip })
    }
  }

  /** Flash and drift start at the muzzle in the first firing cel, independently of later recoil. */
  drawShot(ctx, { name, age, x, y, scale, flip = 1 }) {
    if (age >= .42) return
    const clip = this.sheet.art.clips[name]
    const muzzle = clip?.muzzles?.[0]
    if (!muzzle) return
    const size = scale * this.height / this.sheet.art.standingPixels
    const muzzleX = x + flip * muzzle[0] * size
    const muzzleY = y + muzzle[1] * size
    if (this.flash) {
      if (age < this.flash.seconds('fire'))
        this.flash.draw(ctx, { name: 'fire', time: age, x: muzzleX, y: muzzleY, scaleX: .75, flip })
      return
    }
    const effectScale = scale * (clip.effectScale ?? 1)
    ctx.save()
    if (age < .035) {
      ctx.fillStyle = '#e6d8ad'
      const length = Math.max(1, Math.round(effectScale * .055))
      ctx.fillRect(Math.round(muzzleX) - (flip < 0 ? length : 0), Math.round(muzzleY),
        length, Math.max(1, Math.round(effectScale * .021)))
    }
    const smokeX = muzzleX + flip * age * scale * .36
    const smokeY = muzzleY - age * scale * .32
    const radius = effectScale * (.025 + age * .23)
    ctx.globalAlpha = (1 - age / .42) * .25
    const smoke = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, radius)
    smoke.addColorStop(0, '#bac0c9')
    smoke.addColorStop(1, '#bac0c900')
    ctx.fillStyle = smoke
    ctx.fillRect(smokeX - radius, smokeY - radius, radius * 2, radius * 2)
    ctx.restore()
  }
}
