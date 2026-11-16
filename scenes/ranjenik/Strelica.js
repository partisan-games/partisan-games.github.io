import { canvas2d, ctx } from '/core/io/canvas2d.js'

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
    ctx.moveTo(canvas2d.width * 0.6, canvas2d.height * 0.5)
    ctx.lineTo(canvas2d.width * 0.9, canvas2d.height * 0.5)
    ctx.moveTo(canvas2d.width * 0.8, canvas2d.height * 0.4)
    ctx.lineTo(canvas2d.width * 0.9, canvas2d.height * 0.5)
    ctx.lineTo(canvas2d.width * 0.8, canvas2d.height * 0.6)
    ctx.stroke()
  }
}
