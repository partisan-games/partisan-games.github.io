import Vector from '/core/Vector.js'
import { ctx } from '/core/io/platno.js'
import { layers } from './CombatLayers.js'

const MAX_EFFECTS = 40

/** Short visual reactions; gameplay owns every shot, hit, movement and death. */
export default class BattleFeedback {
  constructor({ units, clock, scrollSpeed }) {
    this.units = units
    this.clock = clock
    this.scrollSpeed = scrollSpeed
    this.effects = []
    this.states = new Map(units.map(unit => [unit, { alive: unit.alive, health: unit.energija, dustAt: 0 }]))
    this.ground = { polozaj: new Vector(0, 0, layers.ground), render: () => this.renderGround() }
    this.front = { polozaj: new Vector(0, 0, layers.effect), render: () => this.renderEffects() }
    for (const unit of units) {
      const pool = unit.granate || unit.fire?.projectiles
      if (pool) pool.onFire = event => this.fire(unit, event)
    }
  }

  add(effect) {
    if (this.effects.length >= MAX_EFFECTS) this.effects.shift()
    this.effects.push({ ...effect, born: this.clock.now })
  }

  fire(owner, { position, angle, projectile }) {
    if (projectile.oznake?.has('air-bomb')) {
      this.add({ kind: 'smoke', x: position.x, y: position.y, duration: .25 })
      return
    }
    const shell = Boolean(projectile.gravitacija)
    this.add({ kind: 'flash', owner, lifeId: owner.lifeId, angle, shell, duration: shell ? .11 : .07 })
    if (shell) this.add({ kind: 'smoke', x: position.x, y: position.y, duration: .4 })
  }

  update() {
    const now = this.clock.now
    this.effects = this.effects.filter(effect => now - effect.born < effect.duration)
    for (const unit of this.units) {
      const state = this.states.get(unit)
      if (state.alive && unit.dead)
        this.add({ kind: 'destruction', x: unit.x, y: unit.y, duration: .45 })
      else if (unit.energija < state.health)
        this.add({ kind: 'impact', x: unit.x, y: unit.y, duration: .18 })
      state.alive = unit.alive
      state.health = unit.energija
      const motion = Math.abs(unit.dx - this.scrollSpeed)
      if (!unit.airborne && unit.prikazan && unit.alive && motion > 15 && now >= state.dustAt) {
        this.add({ kind: 'dust', x: unit.x - Math.sign(unit.dx - this.scrollSpeed) * unit.sirina * .3,
          y: unit.y + unit.visina * .4, duration: .4 })
        state.dustAt = now + .15
      }
    }
  }

  renderGround() {
    ctx.save()
    ctx.fillStyle = '#313b2938'
    for (const unit of this.units) {
      if (!unit.prikazan || unit.airborne) continue
      ctx.beginPath()
      ctx.ellipse(unit.x, unit.y + unit.visina * .46, unit.sirina * .43, 3.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  muzzle(effect) {
    if (effect.owner.airborne) return { ...effect.owner.muzzle, angle: effect.owner.muzzleAngle }
    if (effect.owner.cev) return { ...effect.owner.vrhCevi, angle: effect.owner.cev.ugao }
    if (effect.owner.barrel) return { ...effect.owner.barrel.muzzle, angle: effect.owner.barrel.ugao }
    return { ...effect.owner.fire.muzzle(), angle: effect.angle }
  }

  renderEffects() {
    for (const effect of this.effects) {
      const age = this.clock.now - effect.born
      if (age >= effect.duration) continue
      const progress = age / effect.duration
      ctx.save()
      ctx.globalAlpha = (1 - progress) * (effect.kind === 'dust' || effect.kind === 'smoke' ? .35 : 1)
      if (effect.kind === 'flash') {
        if (!effect.owner.prikazan || effect.owner.dead || effect.owner.lifeId !== effect.lifeId) {
          ctx.restore()
          continue
        }
        const muzzle = this.muzzle(effect)
        ctx.translate(muzzle.x, muzzle.y)
        ctx.rotate(muzzle.angle)
        const length = effect.shell ? 20 : 9
        const height = effect.shell ? 6 : 2.5
        ctx.fillStyle = '#eaa64e'
        ctx.beginPath()
        ctx.moveTo(0, -height * .5)
        ctx.lineTo(length * .6, -height)
        ctx.lineTo(length * .45, -height * .25)
        ctx.lineTo(length, 0)
        ctx.lineTo(length * .45, height * .25)
        ctx.lineTo(length * .6, height)
        ctx.lineTo(0, height * .5)
        ctx.fill()
        ctx.fillStyle = '#fff2c1'
        ctx.fillRect(0, -height * .3, length * .65, height * .6)
      } else {
        const x = effect.x + this.scrollSpeed * age
        const y = effect.y - progress * (effect.kind === 'smoke' ? 15 : 5)
        const explosive = effect.kind === 'destruction' || effect.kind === 'impact'
        if (explosive) {
          const radius = (effect.kind === 'destruction' ? 26 : 10) * (.35 + progress)
          ctx.strokeStyle = '#dcc18a'
          ctx.lineWidth = 2 * (1 - progress)
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = '#ead6aa'
          for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5
            ctx.fillRect(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 2, 2)
          }
        } else {
          ctx.fillStyle = effect.kind === 'smoke' ? '#a6a18b' : '#b4a27e'
          ctx.beginPath()
          ctx.ellipse(x, y, 3 + progress * 11, 2 + progress * 5, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }
}
