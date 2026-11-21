import Flame from '/core/actor/Flame.js'

/** How long a position its burst and fire are drawn for, in pixels; a larger one burns as much larger. */
const drawnFor = 60

/** A short burst when a position is destroyed, then its fire, above its body and gun. */
export default class ShoreDestruction {
  constructor() {
    this.flame = new Flame(0, 0, { reuseParticles: true })
  }

  clear() {
    this.flame.clear()
  }

  /** The fire burns on while the position lies destroyed. */
  update(dt) {
    this.flame.update(dt)
  }

  /** At `x`, `y` on the screen of a position `width` long, `age` seconds after it was destroyed. */
  render(ctx, { x, y, width }, age) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(width / drawnFor, width / drawnFor)
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
