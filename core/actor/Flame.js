import { ctx } from '../io/canvas2d.js'

/** Px per second a spark flies at most, its size in px, its life in seconds, and how many sparks come each second. */
export const flame = { speed: 120, size: 20, life: 1.25, perSecond: 200 }

const getFlameColor = vreme => {
  const red = 260 - vreme * 2
  const green = vreme * 2 + 50
  const blue = vreme * 2
  const opacity = (flame.life - vreme) / flame.life * 0.4
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

const getSmokeColor = vreme => {
  const siva = 50
  const opacity = (flame.life - vreme) / flame.life * 0.3
  return `rgba(${siva}, ${siva}, ${siva}, ${opacity})`
}

class Spark {
  constructor(x, y, dx, dy) {
    this.reset(x, y, dx, dy)
  }

  reset(x, y, dx, dy) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
    this.vreme = 0
  }

  update(dt) {
    this.x += this.dx * dt
    this.y += this.dy * dt
    this.vreme += dt
  }

  render(withSmoke) {
    ctx.fillStyle = withSmoke ? getSmokeColor(this.vreme) : getFlameColor(this.vreme)
    ctx.beginPath()
    const radius = (flame.life - this.vreme) / flame.life * flame.size / 2 + flame.size / 2
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }
}

export default class Flame {
  constructor(x = 200, y = 200, { reuseParticles = false } = {}) {
    this.sparks = []
    this.freeParticles = reuseParticles ? [] : null
    this.x = x
    this.y = y
  }

  spawn(dt) {
    const cesticaPoKrugu = Math.round(flame.perSecond * dt)
    for (let i = 0; i < cesticaPoKrugu; i++) {
      const dx = (Math.random() * 2 * flame.speed - flame.speed) / 2
      const dy = 0 - Math.random() * 2 * flame.speed
      const particle = this.freeParticles?.pop()
      if (particle) particle.reset(this.x, this.y, dx, dy)
      this.sparks.push(particle || new Spark(this.x, this.y, dx, dy))
    }
  }

  update(dt) {
    this.spawn(dt)
    if (this.freeParticles) {
      let active = 0
      for (let i = 0; i < this.sparks.length; i++) {
        const particle = this.sparks[i]
        particle.update(dt)
        if (particle.vreme < flame.life) this.sparks[active++] = particle
        else this.freeParticles.push(particle)
      }
      this.sparks.length = active
      return
    }
    this.sparks.forEach(iskra => iskra.update(dt))
    this.sparks = this.sparks.filter(iskra => iskra.vreme < flame.life)
  }

  clear() {
    if (this.freeParticles)
      for (const particle of this.sparks) this.freeParticles.push(particle)

    this.sparks.length = 0
  }

  render(withSmoke = false) {
    if (!withSmoke) ctx.globalCompositeOperation = 'lighter'
    this.sparks.forEach(iskra => iskra.render(withSmoke))
    ctx.globalCompositeOperation = 'source-over'
  }
}
