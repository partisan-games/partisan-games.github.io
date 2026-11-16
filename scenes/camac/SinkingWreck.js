import { ctx } from '/core/io/canvas2d.js'

const SINK_TIME = 4
const EFFECT_TIME = 5
const SURFACE_TIME = 2.6

/** Destruction presentation and the interval when the hull is still a surface obstacle. */
export default class SinkingWreck {
  constructor(owner, clock) {
    this.owner = owner
    this.clock = clock
    this.reset()
    this.effects = { position: { z: -2 }, render: () => this.renderEffects() }
  }

  reset() {
    this.startedAt = null
  }
  start() {
    if (this.startedAt === null) this.startedAt = this.clock.now
  }
  get age() {
    return this.startedAt === null ? 0 : this.clock.now - this.startedAt
  }
  get progress() {
    return Math.min(1, this.age / SINK_TIME)
  }
  get solid() {
    return this.startedAt !== null && this.age < SURFACE_TIME
  }
  get finished() {
    return this.startedAt !== null && this.age >= EFFECT_TIME
  }

  renderEffects() {
    const boat = this.owner
    if (this.startedAt === null || this.finished || !boat.shown) return
    const { age } = this
    ctx.save()
    // Fixed emission times avoid allocating particle objects during destruction.
    for (let i = 0; i < 12; i++) {
      const elapsed = age - i * .18
      if (elapsed < 0 || elapsed >= 1.6) continue
      const progress = elapsed / 1.6
      const along = Math.cos(i * 2.3) * boat.width * .12
      const x = boat.x + Math.cos(boat.angle) * along + Math.sin(i * 1.7) * progress * 12
      const y = boat.y + Math.sin(boat.angle) * along - progress * 48
      ctx.fillStyle = `rgba(53, 58, 54, ${(1 - progress) * .4})`
      ctx.beginPath()
      ctx.arc(x, y, 4 + progress * 13, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = 0; i < 18; i++) {
      const elapsed = age - .55 - i * .22
      if (elapsed < 0 || elapsed >= .65) continue
      const progress = elapsed / .65
      const along = Math.sin(i * 2.1) * boat.width * .32
      const x = boat.x + Math.cos(boat.angle) * along + Math.sin(i) * 5
      const y = boat.y + Math.sin(boat.angle) * along - progress * 8
      ctx.strokeStyle = `rgba(194, 222, 225, ${(1 - progress) * .7})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 1 + progress * 3, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.strokeStyle = `rgba(170, 201, 205, ${.4 * (1 - age / EFFECT_TIME)})`
    ctx.lineWidth = 1
    ctx.translate(boat.x, boat.y)
    ctx.rotate(boat.angle)
    ctx.beginPath()
    ctx.ellipse(0, 0, boat.width * .4 + age * 4, boat.height * .45 + age * 3, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
