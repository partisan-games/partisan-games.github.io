import GameObject2D from '/core/actor/GameObject2D.js'
import mouse from '/core/io/mouse.js'
import { createSound, randomVolume } from '/core/io/sound.js'
import { ctx } from '/core/io/canvas2d.js'

const rafal = createSound('rafal.mp3')
const SHOT_INTERVAL = .18
const FALL_TIME = 1.2
const frameCache = new Map()

export default class Svabo extends GameObject2D {

  constructor({ scale, ucestalost = 0.03, callback, faction = 'nemci', variant = 0 }) {
    super ('armies/rov-prazan.gif', { scale })
    this.scale = scale
    this.variant = variant
    this.idlePhase = Math.random() * Math.PI * 2
    this.art = new GameObject2D(`armies/game-ready/vojnici/${faction}-spreda.png`,
      { visible: false, width: 64, height: 72 })
    this.frames = null
    this.art.onload = () => {
      if (!frameCache.has(faction)) {
        const frames = Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 3 }, (_, column) => {
            const frame = document.createElement('canvas')
            frame.width = 68
            frame.height = 76
            frame.getContext('2d').drawImage(this.art.image, column * 64, row * 72, 64, 72, 2, 2, 64, 72)
            return frame
          }))
        frameCache.set(faction, frames)
      }
      this.frames = frameCache.get(faction)
    }
    this.children.push(this.art)
    this.ucestalost = ucestalost
    this.callback = callback
    rafal.volume = randomVolume()
    this.init()
  }

  init() {
    this.stoji = false
    this.aimElapsed = 0
    this.vremeNisanjenja = 2.5
    this.firing = false
    this.fallenFor = 0
    this.animationTime = 0
    this.fireElapsed = 0
  }

  povremenoUstaje(dt) {
    if (!this.stoji && !this.fallenFor && Math.random() < this.ucestalost * dt)
      this.ustani()
  }

  stav(bul) {
    this.stoji = bul
    this.firing = false
    this.fallenFor = bul ? 0 : FALL_TIME
    this.fireElapsed = 0
    if (bul) this.aimElapsed = 0
  }

  ustani() {
    this.stav(true)
  }

  padni() {
    this.stav(false)
  }

  shoot() {
    if (!this.firing) {
      this.firing = true
      this.fireElapsed = 0
    }
  }

  jePogodjen() {
    return this.stoji && mouse.isOver(this)
  }

  jeSpreman() {
    if (!this.stoji) return false
    return this.aimElapsed >= this.vremeNisanjenja
  }

  ubrzaj(n) {
    this.ucestalost *= n
  }

  update(dt) {
    super.update(dt)
    this.animationTime += dt
    if (this.firing) this.fireElapsed += dt
    this.fallenFor = Math.max(0, this.fallenFor - dt)
    this.povremenoUstaje(dt)
    if (this.stoji) this.aimElapsed += dt
    if (this.jeSpreman()) {
      this.shoot()
      rafal.play()
      this.callback(10, dt)
    }
  }

  renderFigure(row, { x = 0, y = 0, angle = 0, alpha = 1 } = {}) {
    const { scale } = this
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.translate(this.x + x * scale, this.y + y * scale)
    ctx.rotate(angle)
    // An isolated, padded frame cannot sample neighboring poses when rotated or scaled.
    ctx.drawImage(this.frames[row][this.variant], -34 * scale, -62 * scale, 68 * scale, 76 * scale)
    ctx.restore()
  }

  render() {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.imageSmoothingEnabled = false
    if ((this.stoji || this.fallenFor) && this.frames)
      if (!this.stoji) {
        const elapsed = FALL_TIME - this.fallenFor
        const collapse = Math.min(1, elapsed / .35)
        const settle = Math.min(1, Math.max(0, (elapsed - .35) / .85))
        const direction = this.variant % 2 ? 1 : -1
        if (collapse < 1) this.renderFigure(1, {
          x: direction * collapse * 3, y: collapse * 6,
          angle: direction * collapse * .2, alpha: 1 - collapse,
        })
        this.renderFigure(3, { x: direction * collapse * 3, y: collapse * 6 + settle * 16,
          angle: direction * settle * .08, alpha: collapse })
      } else if (this.firing) {
        const phase = this.fireElapsed % SHOT_INTERVAL
        const recoil = Math.max(0, 1 - phase / .09)
        this.renderFigure(phase < .055 ? 2 : 1, { y: recoil * 1.8, angle: recoil * .012 })
      } else {
        const breath = Math.sin(this.animationTime * 2.7 + this.idlePhase)
        const rise = Math.min(1, this.aimElapsed / .28)
        if (rise < 1) this.renderFigure(0, { alpha: 1 - rise })
        this.renderFigure(1, { x: Math.sin(this.animationTime * 1.3 + this.idlePhase) * .45,
          y: (1 - rise) * 10 + breath * .65, angle: breath * .006, alpha: rise })
      }

    ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
