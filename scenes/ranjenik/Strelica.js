import { platno, ctx } from '/core/io/platno.js'

const trajanjeStrelice = 500
const pauzaCrtanja = 3000

export default class Strelica {
  constructor() {
    this.vidljiva = false
    this.elapsed = 0
  }

  update(dt) {
    this.elapsed += dt * 1000
    if (!this.vidljiva && this.elapsed < pauzaCrtanja) return
    if (this.vidljiva && this.elapsed < trajanjeStrelice) return

    this.vidljiva = !this.vidljiva
    this.elapsed = 0
  }

  render() {
    if (!this.vidljiva) return
    ctx.lineWidth = 5
    ctx.strokeStyle = 'red'
    ctx.beginPath()
    ctx.moveTo(platno.width * 0.6, platno.height * 0.5)
    ctx.lineTo(platno.width * 0.9, platno.height * 0.5)
    ctx.moveTo(platno.width * 0.8, platno.height * 0.4)
    ctx.lineTo(platno.width * 0.9, platno.height * 0.5)
    ctx.lineTo(platno.width * 0.8, platno.height * 0.6)
    ctx.stroke()
  }
}
