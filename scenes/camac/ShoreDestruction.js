import { ctx } from '/core/io/platno.js'
import Plamen from '/core/actor/Plamen.js'

/** A short impact burst followed by the existing pooled flame, above body and gun. */
export default class ShoreDestruction {
  constructor(owner, session) {
    this.owner = owner
    this.session = session
    this.flame = new Plamen(0, 0, { reuseParticles: true })
    this.startedAt = null
    this.drawable = { polozaj: { z: -2 }, render: () => this.render() }
  }

  reset() {
    this.startedAt = null
    this.flame.clear()
  }

  start() {
    if (this.startedAt === null) this.startedAt = this.session.clock.now
  }

  update(dt) {
    if (this.session.state === 'running' && this.startedAt !== null && this.owner.dead && this.owner.prikazan)
      this.flame.update(dt)
  }

  render() {
    const owner = this.owner
    if (this.startedAt === null || !owner.dead || !owner.prikazan) return
    const age = this.session.clock.now - this.startedAt
    ctx.save()
    ctx.translate(owner.x, owner.y)
    if (age < .45) {
      const progress = age / .45
      ctx.globalAlpha = 1 - progress
      ctx.fillStyle = '#ed8a37'
      ctx.beginPath()
      ctx.arc(0, 0, 7 + progress * 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe4a3'
      ctx.beginPath()
      ctx.arc(0, 0, 4 + progress * 8, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3
        const radius = 9 + progress * 26
        ctx.fillRect(Math.cos(angle) * radius, Math.sin(angle) * radius, 2, 2)
      }
    }
    ctx.globalAlpha = 1
    ctx.scale(.28, .28)
    this.flame.render()
    ctx.restore()
  }
}
