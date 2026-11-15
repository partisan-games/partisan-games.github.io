import platno, { ctx } from '/core/io/platno.js'

const lerp = (a, b, t) => a + (b - a) * t

export default class Obala {
  constructor(viewLeft = () => 0) {
    this.viewLeft = viewLeft
    this.polozaj = { z: 1 }
    this.noiseResolution = 75
    this.opsegSuma = 10
    this.sirinaReke = platno.height - this.noiseResolution * .75
    this.seed = Math.floor(Math.random() * 0x100000000)
  }

  sample(index) {
    // A position has the same bank on every visit, without storing the traveled river.
    let hash = (index ^ this.seed) | 0
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
    return (((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff * 2 - 1) * this.opsegSuma
  }

  offsetAt(x) {
    const index = Math.floor(x / this.noiseResolution)
    const t = x / this.noiseResolution - index
    return lerp(this.sample(index), this.sample(index + 1), t)
  }

  edgeAt(x, side) {
    return platno.height / 2 + this.offsetAt(x) + side * this.sirinaReke / 2
  }

  render() {
    const left = this.viewLeft()
    const right = left + platno.width
    const first = Math.floor(left / this.noiseResolution) * this.noiseResolution
    const last = Math.ceil(right / this.noiseResolution) * this.noiseResolution
    ctx.fillStyle = '#228B22'
    for (const side of [-1, 1]) {
      const edge = side < 0 ? 0 : platno.height
      ctx.beginPath()
      ctx.moveTo(first, edge)
      for (let x = first; x <= last; x += this.noiseResolution) {
        ctx.lineTo(x, this.edgeAt(x, side))
      }
      ctx.lineTo(last, edge)
      ctx.closePath()
      ctx.fill()
    }
  }
}
