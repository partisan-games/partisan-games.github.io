import BodySprite from '/core/actor/BodySprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'

/** Seconds between two shots of the burst, as drawn. */
const shotInterval = .18
const frameCache = new Map()

/**
 * How a soldier of the `faction` army ('nemci' or 'cetnici') looks and sounds in his trench, seen from the front, at
 * `scale` of his picture, the farther row smaller: rising and breathing as he aims, firing with recoil and the sound of
 * his burst, and collapsing back into the trench. `variant` picks one of three men. His place is the middle of his
 * trench on the screen. It only reads the body.
 */
export default class TrenchSoldierSprite extends BodySprite {
  constructor(body, { faction = 'nemci', variant = 0, scale = 1, projection, camera }) {
    super(body, 'armies/rov-prazan.gif', { projection, camera, scale })
    Object.assign(this, { faction, variant, scale })
    this.idlePhase = Math.random() * Math.PI * 2
    this.animationTime = 0
    this.frames = frameCache.get(faction) ?? null
    if (!this.frames) {
      const art = new Image()
      art.onload = () => {
        frameCache.set(faction, Array.from({ length: 4 }, (_, row) => Array.from({ length: 3 }, (_, column) => {
          const frame = document.createElement('canvas')
          frame.width = 68
          frame.height = 76
          frame.getContext('2d').drawImage(art, column * 64, row * 72, 64, 72, 2, 2, 64, 72)
          return frame
        })))
        this.frames = frameCache.get(faction)
      }
      art.src = `/assets/images/armies/game-ready/vojnici/${faction}-spreda.png`
    }
    this.burstSound = new Sound('rafal.mp3', { loop: true, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
  }

  /** The trench keeps its picture's size at its scale. */
  onload() {
    this.width = this.image.naturalWidth * this.scale
    this.height = this.image.naturalHeight * this.scale
    this.fit()
  }

  fit() {
    const { x, y } = this.projection.point(this.body)
    this.setPosition(x, y)
    this.alive = this.body.alive
  }

  update(dt) {
    super.update(dt)
    this.animationTime += dt
    this.burstSound.setPlaying(this.body.state === 'fire')
  }

  renderFigure(ctx, row, { x = 0, y = 0, angle = 0, alpha = 1 } = {}) {
    const { scale } = this
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.translate(this.x + x * scale, this.y + y * scale)
    ctx.rotate(angle)
    // an isolated, padded frame cannot sample neighbouring poses when turned or scaled
    ctx.drawImage(this.frames[row][this.variant], -34 * scale, -62 * scale, 68 * scale, 76 * scale)
    ctx.restore()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const { state, stateTime } = this.body
    ctx.save()
    ctx.imageSmoothingEnabled = false
    if (state !== 'hidden' && this.frames)
      if (state === 'fall') {
        const collapse = Math.min(1, stateTime / .35)
        const settle = Math.min(1, Math.max(0, (stateTime - .35) / (trench.fallTime - .35)))
        const direction = this.variant % 2 ? 1 : -1
        if (collapse < 1) this.renderFigure(ctx, 1, {
          x: direction * collapse * 3, y: collapse * 6, angle: direction * collapse * .2, alpha: 1 - collapse,
        })
        this.renderFigure(ctx, 3, { x: direction * collapse * 3, y: collapse * 6 + settle * 16,
          angle: direction * settle * .08, alpha: collapse })
      } else if (state === 'fire') {
        const phase = stateTime % shotInterval
        const recoil = Math.max(0, 1 - phase / .09)
        this.renderFigure(ctx, phase < .055 ? 2 : 1, { y: recoil * 1.8, angle: recoil * .012 })
      } else {
        const breath = Math.sin(this.animationTime * 2.7 + this.idlePhase)
        const rise = Math.min(1, stateTime / .28)
        if (rise < 1) this.renderFigure(ctx, 0, { alpha: 1 - rise })
        this.renderFigure(ctx, 1, { x: Math.sin(this.animationTime * 1.3 + this.idlePhase) * .45,
          y: (1 - rise) * 10 + breath * .65, angle: breath * .006, alpha: rise })
      }
    ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
