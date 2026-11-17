import Sound from '/core/io/ManagedSound.js'

const sources = [
  { x: .39, y: .565, flame: .18, scale: .5, life: 13, rise: 9, drift: .7, spread: 1.8, tone: 91, phase: 1.1 },
  { x: .55, y: .596, flame: .3, scale: .65, life: 17, rise: 10, drift: 1.4, spread: 2.1, tone: 65, phase: 4.7 },
  { x: .49, y: .63, flame: .2, scale: .4, life: 11, rise: 8, drift: -.4, spread: 1.6, tone: 83, phase: 2.3 },
  { x: .90, y: .42, flame: .4, scale: .85, life: 19, rise: 11, drift: 1.7, spread: 2.3, tone: 53, phase: 5.2 },
  { x: .09, y: .445, flame: .7, scale: .7, life: 10, rise: 9, drift: -1.4, spread: 1.8, tone: 55, phase: .8 },
  { x: .235, y: .45, flame: .65, scale: 1.3, life: 22, rise: 12, drift: -1.9, spread: 2.8, tone: 42, phase: 3.6 },
  { x: .34, y: .52, flame: .45, scale: .65, life: 14, rise: 9, drift: -.8, spread: 1.7, tone: 66, phase: 6.1 },
  { x: .815, y: .515, flame: .85, scale: 1, life: 21, rise: 11, drift: 1.2, spread: 2.4, tone: 44, phase: 2.8 },
]

/** Animated independently of the clean village artwork, using the scene's presentation time. */
export default class VillageFire {
  constructor() {
    this.fireSound = new Sound('fire.mp3', { volume: .65, loop: true })
    this.sounds = [this.fireSound]
    this.canvas = document.createElement('canvas')
    this.canvas.width = 792
    this.canvas.height = 496
    this.ctx = this.canvas.getContext('2d')
  }

  smoke(time, source, windSpeed) {
    const { ctx, canvas } = this
    const count = 40
    for (let i = 0; i < count; i++) {
      const age = (time + source.phase + i * source.life / count) % source.life
      const fade = Math.min(1, age / .8, (source.life - age) / 3)
      const radius = source.scale * (3 + Math.sqrt(age) * source.spread) * (.85 + .2 * Math.sin(i * 2.3))
      const x = source.x * canvas.width + age * (windSpeed ?? source.drift)
        + Math.sin(age * .6 + source.phase + i * .7) * age * .45
      const y = source.y * canvas.height - 3 - age * source.rise
      const tone = source.tone + i % 3 * 5
      ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone + 2}, ${fade * .32})`
      ctx.beginPath()
      for (const [dx, dy, size] of [[-.4, 0, .7], [.35, -.15, .85], [0, -.5, .6]]) {
        const cx = Math.round(x + radius * dx)
        const cy = Math.round(y + radius * dy)
        const r = Math.max(1, Math.round(radius * size))
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }

  flame(time, source, windSpeed = 0) {
    const { ctx, canvas } = this
    ctx.save()
    ctx.translate(Math.round(source.x * canvas.width), Math.round(source.y * canvas.height))
    ctx.scale(source.flame, source.flame)
    for (let x = -12; x <= 12; x++) {
      const height = (1 - Math.abs(x) / 16)
        * (16 + 4 * Math.sin(time * 6 + x * .7 + source.phase) + 3 * Math.sin(time * 9 - x))
      const sway = Math.round(Math.sin(time * 4 + x * .3) * height * .12 + windSpeed / 60 * height)
      ctx.fillStyle = '#a64b30'
      ctx.fillRect(x + sway, -height, 1, height)
      ctx.fillStyle = '#d6833c'
      ctx.fillRect(x + sway, -height * .65, 1, height * .65)
      ctx.fillStyle = '#edc773'
      ctx.fillRect(x, -height * .25, 1, height * .25)
    }
    ctx.restore()
  }

  render(time, windSpeed) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const source of sources) this.smoke(time, source, windSpeed)
    for (const source of sources) this.flame(time, source, windSpeed)
  }
}
