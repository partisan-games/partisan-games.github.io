import platno, { ctx } from '/core/io/platno.js'

const lerp = (a, b, t) => a + (b - a) * t

const random = opsegSuma => Math.random() * opsegSuma * 2 - opsegSuma

export default class Obala {
  constructor() {
    this.noiseResolution = 75
    this.opsegSuma = 10
    this.sirinaReke = platno.height - this.noiseResolution * .75
    this.noisePoints = Array.from({ length: platno.width / this.noiseResolution + 2 }, () => random(this.opsegSuma))
    this.history = []
  }

  napred() {
    this.history.push([...this.noisePoints])
    this.noisePoints.shift()
    this.noisePoints.push(random(this.opsegSuma))
  }

  nazad() {
    if (this.history.length > 0)
      this.noisePoints = this.history.pop()
  }

  render() {
    for (let i = 0; i < platno.width; i++) {
      const index = Math.floor(i / this.noiseResolution)
      const t = (i % this.noiseResolution) / this.noiseResolution
      const offset = lerp(this.noisePoints[index], this.noisePoints[index + 1], t)

      ctx.fillStyle = '#228B22'
      ctx.fillRect(i, 0, 1, platno.height / 2 + offset - this.sirinaReke / 2)
      ctx.fillRect(i, platno.height / 2 + offset + this.sirinaReke / 2, 1, platno.height)
    }
  }
}
