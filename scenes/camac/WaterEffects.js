import canvas2d, { ctx } from '/core/io/canvas2d.js'

/** Bounded world-space effects; rendering never advances their lifetime. */
export default class WaterEffects {
  constructor({ session, viewLeft }) {
    this.session = session
    this.viewLeft = viewLeft
    this.wakes = Array.from({ length: 96 }, () => ({ life: 0 }))
    this.hits = Array.from({ length: 24 }, () => ({ life: 0 }))
    this.wakeIndex = this.hitIndex = 0
    this.trailDistance = new WeakMap()
    this.drawables = [
      { position: { z: .75 }, render: () => this.renderWakes() },
      { position: { z: -2 }, render: () => this.renderHits() },
    ]
  }

  update(dt) {
    if (this.session.state !== 'running') return
    for (const effect of this.wakes) effect.life = Math.max(0, effect.life - dt)
    for (const effect of this.hits) effect.life = Math.max(0, effect.life - dt)
  }

  trail(boat, before, dt) {
    if (boat.dead || !boat.visible || !Number.isFinite(boat.width)) return
    const dx = boat.x - before.x, dy = boat.y - before.y
    const distance = Math.hypot(dx, dy)
    if (!dt || distance / dt < 20) {
      this.trailDistance.delete(boat); return
    }
    // Uniform distance sampling avoids gaps after a slow frame and keeps both directions valid.
    const carried = this.trailDistance.get(boat) || 0
    const count = Math.min(12, Math.floor((carried + distance) / 12))
    this.trailDistance.set(boat, (carried + distance) % 12)
    for (let i = 0; i < count; i++) {
      const fraction = (12 - carried + i * 12) / distance
      const mark = this.wakes[this.wakeIndex++ % this.wakes.length]
      mark.x = before.x + dx * fraction - dx / distance * boat.width * .4
      mark.y = before.y + dy * fraction - dy / distance * boat.width * .4
      mark.angle = Math.atan2(dy, dx)
      mark.width = boat.height * .35
      mark.life = 1.6
    }
  }

  hit(x, y, onWater) {
    const hit = this.hits[this.hitIndex++ % this.hits.length]
    Object.assign(hit, { x, y, onWater, life: .35 })
  }

  visible(x, margin = 50) {
    return x >= this.viewLeft() - margin && x <= this.viewLeft() + canvas2d.width + margin
  }

  renderWakes() {
    ctx.save()
    ctx.strokeStyle = '#b2d1df'
    ctx.lineWidth = 1.4
    for (const mark of this.wakes) {
      if (!mark.life || !this.visible(mark.x)) continue
      const age = 1 - mark.life / 1.6
      ctx.save()
      ctx.globalAlpha = (1 - age) * .35
      ctx.translate(mark.x, mark.y)
      ctx.rotate(mark.angle)
      const width = mark.width + age * 16
      ctx.beginPath()
      ctx.moveTo(-10 - age * 12, -width)
      ctx.lineTo(0, -mark.width)
      ctx.moveTo(-10 - age * 12, width)
      ctx.lineTo(0, mark.width)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }

  renderHits() {
    ctx.save()
    for (const hit of this.hits) {
      if (!hit.life || !this.visible(hit.x)) continue
      const progress = 1 - hit.life / .35
      ctx.globalAlpha = 1 - progress
      ctx.strokeStyle = hit.onWater ? '#d3e6ee' : '#f6cd83'
      ctx.lineWidth = hit.onWater ? 1.5 : 2
      ctx.beginPath()
      if (hit.onWater) ctx.ellipse(hit.x, hit.y, 3 + progress * 13, 2 + progress * 8, 0, 0, Math.PI * 2)
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 2 / 5
        const radius = 3 + progress * 12
        ctx.moveTo(hit.x + Math.cos(angle) * radius, hit.y + Math.sin(angle) * radius)
        ctx.lineTo(hit.x + Math.cos(angle) * (radius + 4), hit.y + Math.sin(angle) * (radius + 4))
      }
      ctx.stroke()
    }
    ctx.restore()
  }
}
