import { ctx } from '../io/platno.js'

const brzina = 120
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
  const siva = 100 + vreme * 30
  const opacity = (zivotniVek - vreme) / zivotniVek * 0.3
  return `rgba(${siva}, ${siva}, ${siva}, ${opacity})`
}

class Iskra {
  constructor(x, y, dx, dy) {
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

  render(praviDim) {
    ctx.fillStyle = praviDim ? getSmokeColor(this.vreme) : getFlameColor(this.vreme)
    ctx.beginPath()
    const radius = (zivotniVek - this.vreme) / zivotniVek * velicina / 2 + velicina / 2
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }
}

export default class Plamen {
  constructor(x = 200, y = 200) {
    this.iskre = []
    this.x = x
    this.y = y
  }

  stvaraj(dt) {
    const cesticaPoKrugu = Math.round(cesticaPoSekundi * dt)
    for (let i = 0; i < cesticaPoKrugu; i++) {
      const dx = (Math.random() * 2 * brzina - brzina) / 2
      const dy = 0 - Math.random() * 2 * brzina
      this.iskre.push(new Iskra(this.x, this.y, dx, dy))
    }
  }

  update(dt) {
    this.stvaraj(dt)
    this.iskre.forEach(iskra => iskra.update(dt))
    this.iskre = this.iskre.filter(iskra => iskra.vreme < zivotniVek)
  }

  render(praviDim = false) {
    if (!praviDim) ctx.globalCompositeOperation = 'lighter'
    this.iskre.forEach(iskra => iskra.render(praviDim))
    ctx.globalCompositeOperation = 'source-over'
  }
}
