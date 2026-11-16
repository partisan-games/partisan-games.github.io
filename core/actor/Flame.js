import { ctx } from '../io/canvas2d.js'

const speed = 120
const velicina = 20
const zivotniVek = 1.25
const cesticaPoSekundi = 200

const getFlameColor = vreme => {
  const red = 260 - vreme * 2
  const green = vreme * 2 + 50
  const blue = vreme * 2
  const opacity = (zivotniVek - vreme) / zivotniVek * 0.4
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

const getSmokeColor = vreme => {
  const siva = 50
  const opacity = (zivotniVek - vreme) / zivotniVek * 0.3
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
    const radius = (zivotniVek - this.vreme) / zivotniVek * velicina / 2 + velicina / 2
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
    const cesticaPoKrugu = Math.round(cesticaPoSekundi * dt)
    for (let i = 0; i < cesticaPoKrugu; i++) {
      const dx = (Math.random() * 2 * speed - speed) / 2
      const dy = 0 - Math.random() * 2 * speed
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
        if (particle.vreme < zivotniVek) this.sparks[active++] = particle
        else this.freeParticles.push(particle)
      }
      this.sparks.length = active
      return
    }
    this.sparks.forEach(iskra => iskra.update(dt))
    this.sparks = this.sparks.filter(iskra => iskra.vreme < zivotniVek)
  }

  clear() {
    if (this.freeParticles) {
      for (const particle of this.sparks) this.freeParticles.push(particle)
    }
    this.sparks.length = 0
  }

  render(withSmoke = false) {
    if (!withSmoke) ctx.globalCompositeOperation = 'lighter'
    this.sparks.forEach(iskra => iskra.render(withSmoke))
    ctx.globalCompositeOperation = 'source-over'
  }
}
