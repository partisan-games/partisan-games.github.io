import GameObject2D from '/core/actor/GameObject2D.js'
import mouse from '/core/io/mouse.js'
import Sound from '/core/io/audio/SoundSource.js'
import { ctx } from '/core/io/canvas2d.js'
import StateMachine from '/core/gameplay/StateMachine.js'

const SHOT_INTERVAL = .18
const FALL_TIME = 1.2
const frameCache = new Map()

/** A soldier in a trench: the seconds he aims after he rises, and the damage his fire does per second. */
export const trench = { aimTime: 2.5, damage: 10 }

/**
 * The soldier hides in his trench, or rises and aims, then fires at the viewer until he is hit and falls back into
 * the trench. Hiding and firing last until he is set to another; aiming and falling end by themselves.
 */
const states = {
  hidden: {},
  aim: {
    enter: soldier => {
      soldier.aimElapsed = 0
    },
    update: (soldier, dt) => {
      soldier.aimElapsed += dt
      if (soldier.aimElapsed < trench.aimTime) return
      soldier.setState('fire')
      soldier.strike(dt)
    },
  },
  fire: {
    enter: soldier => {
      soldier.burstSound.setPlaying(true)
      soldier.fireElapsed = 0
    },
    update: (soldier, dt) => {
      soldier.fireElapsed += dt
      soldier.strike(dt)
    },
    exit: soldier => soldier.burstSound.setPlaying(false),
  },
  fall: {
    enter: soldier => {
      soldier.fallenFor = FALL_TIME
    },
    update: (soldier, dt) => {
      soldier.fallenFor = Math.max(0, soldier.fallenFor - dt)
      if (!soldier.fallenFor) soldier.setState('hidden')
    },
  },
}

/** A soldier seen from the front in his trench, who rises to fire at the viewer, who shoots him with the mouse. */
export default class TrenchSoldier extends GameObject2D {
  /** `callback(damage, dt)` is called each frame he fires. */
  constructor({ scale, callback, faction = 'nemci', variant = 0 }) {
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
    this.callback = callback
    this.burstSound = new Sound('rafal.mp3', { loop: true, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
    this.aimElapsed = 0
    this.fallenFor = 0
    this.animationTime = 0
    this.fireElapsed = 0
    this.machine = new StateMachine(this, states, 'hidden')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** Whether he stands up out of the trench, where he can be hit. */
  get stoji() {
    return this.state === 'aim' || this.state === 'fire'
  }

  strike(dt) {
    this.callback?.(trench.damage, dt)
  }

  jePogodjen() {
    return this.stoji && mouse.isOver(this)
  }

  update(dt) {
    super.update(dt)
    this.animationTime += dt
    this.machine.update(dt)
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
    if (this.state !== 'hidden' && this.frames)
      if (this.state === 'fall') {
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
      } else if (this.state === 'fire') {
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
