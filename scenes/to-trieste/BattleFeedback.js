const MAX_EFFECTS = 40

/**
 * Short visual reactions to what the bodies do: a flash and smoke at a shot, a puff where a hit lands, a ring where a
 * body is destroyed, dust behind what drives on the road, and shadows under it. It only reads the bodies, whose
 * `units()` it is given each frame, through `projection`, and those that `flies(body)` are in the air; its effects go
 * by the presentation `clock`. The road's shadows draw on the `layers.ground` layer, the rest in front of everything.
 */
export default class BattleFeedback {
  constructor({ units, flies, projection, clock, layers }) {
    Object.assign(this, { units, flies, projection, clock })
    this.effects = []
    /** What each body was last seen doing. */
    this.seen = new Map()
    this.ground = { position: { z: layers.ground }, render: ctx => this.renderGround(ctx) }
    this.front = { position: { z: layers.effect }, render: ctx => this.renderEffects(ctx) }
  }

  add(effect) {
    if (this.effects.length >= MAX_EFFECTS) this.effects.shift()
    this.effects.push({ ...effect, born: this.clock.now })
  }

  onRoad(body) {
    return !this.flies(body)
  }

  at(point) {
    return this.projection.point(point)
  }

  update() {
    const { now } = this.clock
    this.effects = this.effects.filter(effect => now - effect.born < effect.duration)
    for (const body of this.units()) {
      const seen = this.seen.get(body) ?? { shots: body.shotsFired, alive: body.alive, hits: body.hitsTaken, dustAt: 0 }
      if (body.shotsFired > seen.shots && body.muzzle) {
        const shell = Boolean(body.shells)
        this.add({ kind: 'flash', ...this.at(body.muzzle), shell, duration: shell ? .11 : .07 })
        if (shell) this.add({ kind: 'smoke', ...this.at(body.muzzle), duration: .4 })
      }
      if (seen.alive && body.dead) this.add({ kind: 'destruction', ...this.at(body), duration: .45 })
      else if (body.hitsTaken > seen.hits) this.add({ kind: 'impact', ...this.at(body), duration: .18 })
      if (this.onRoad(body) && body.alive && Math.abs(body.vx) > .75 && now >= seen.dustAt) {
        const back = { x: body.x - Math.sign(body.vx) * body.size.length * .3, y: body.y - body.size.height * .4 }
        this.add({ kind: 'dust', ...this.at(back), duration: .4 })
        seen.dustAt = now + .15
      }
      Object.assign(seen, { shots: body.shotsFired, alive: body.alive, hits: body.hitsTaken })
      this.seen.set(body, seen)
    }
  }

  renderGround(ctx) {
    ctx.save()
    ctx.fillStyle = '#313b2938'
    for (const body of this.units()) {
      if (!this.onRoad(body)) continue
      const { x, y } = this.at({ x: body.x, y: body.y - body.size.height * .46 })
      ctx.beginPath()
      ctx.ellipse(x, y, this.projection.length(body.size.length) * .43, 3.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  renderEffects(ctx) {
    for (const effect of this.effects) {
      const age = this.clock.now - effect.born
      if (age >= effect.duration) continue
      const progress = age / effect.duration
      ctx.save()
      ctx.globalAlpha = (1 - progress) * (effect.kind === 'dust' || effect.kind === 'smoke' ? .35 : 1)
      if (effect.kind === 'flash') {
        const radius = effect.shell ? 10 : 4
        ctx.fillStyle = '#eaa64e'
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, radius * (1 - progress * .5), 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff2c1'
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, radius * .5, 0, Math.PI * 2)
        ctx.fill()
      } else if (effect.kind === 'destruction' || effect.kind === 'impact') {
        const radius = (effect.kind === 'destruction' ? 26 : 10) * (.35 + progress)
        const y = effect.y - progress * 5
        ctx.strokeStyle = '#dcc18a'
        ctx.lineWidth = 2 * (1 - progress)
        ctx.beginPath()
        ctx.arc(effect.x, y, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = '#ead6aa'
        for (let i = 0; i < 5; i++) {
          const angle = i * Math.PI * 2 / 5
          ctx.fillRect(effect.x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 2, 2)
        }
      } else {
        const y = effect.y - progress * (effect.kind === 'smoke' ? 15 : 5)
        ctx.fillStyle = effect.kind === 'smoke' ? '#a6a18b' : '#b4a27e'
        ctx.beginPath()
        ctx.ellipse(effect.x, y, 3 + progress * 11, 2 + progress * 5, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }
}
