import BodySprite from '/core/actor/BodySprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'

/** Seconds between two shots of the burst, as drawn. */
const shotInterval = .18
const frameCache = new Map()

/**
 * How a soldier of the `faction` army ('nemci' or 'cetnici') looks and sounds, seen from the front, at
 * `scale` of his picture, the farther row smaller: rising and breathing as he aims, firing with recoil and the sound of
 * his burst, and collapsing out of sight. `variant` picks one of three men. The art ends at the waist; the scene
 * supplies any cover in front of it. The body's point is 24 scaled pixels below the figure's centre. It only reads the body.
 */
export default class TrenchSoldierSprite extends BodySprite {
  constructor(body, { faction = 'nemci', variant = 0, scale = 1, projection, camera }) {
    super(body, `armies/game-ready/vojnici/${faction}-spreda.png`, { projection, camera, scale,
      width: 68 * scale, height: 76 * scale })
    Object.assign(this, { faction, variant, scale })
    this.idlePhase = Math.random() * Math.PI * 2
    this.animationTime = 0
    this.frames = frameCache.get(faction) ?? null
    this.burstSound = new Sound('rafal.mp3', { loop: true, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
  }

  /** The soldier owns only his atlas; loading it also prepares the padded poses before the scene starts. */
  onload() {
    if (!this.frames) {
      this.frames = frameCache.get(this.faction) ?? Array.from({ length: 4 }, (_, row) => Array.from({ length: 3 }, (_, column) => {
        const frame = document.createElement('canvas')
        frame.width = 68
        frame.height = 76
        frame.getContext('2d').drawImage(this.image, column * 64, row * 72, 64, 72, 2, 2, 64, 72)
        return frame
      }))
      frameCache.set(this.faction, this.frames)
    }
    this.fit()
  }

  fit() {
    const { x, y } = this.projection.point(this.body)
    this.setPosition(x, y - 24 * this.width / 68)
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
    ctx.drawImage(this.frames[row][this.variant], -34 * scale, -38 * scale, 68 * scale, 76 * scale)
    ctx.restore()
  }

  render(ctx) {
    if (!this.shown || !this.frames) return
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
    ctx.restore()
  }
}
