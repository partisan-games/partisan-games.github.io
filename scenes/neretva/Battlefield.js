import { assets } from '/config.js'

// Screen fractions and widths, from the distant field to the ground around the defenders.
const scars = [[.26, .36, .036], [.73, .40, .05], [.08, .68, .08], [.84, .71, .09],
  [.24, .83, .115], [.92, .93, .13]]
const ripples = [[.40, .740, .026], [.48, .756, .041], [.57, .775, .033], [.63, .744, .048],
  [.73, .767, .027], [.80, .731, .036], [.89, .757, .031], [.94, .718, .019]]
const smokeLifetime = 4
const maxImpacts = 4
const smokeRows = [[4, 8], [2, 10], [1, 11], [0, 12], [0, 12], [1, 11], [3, 10], [5, 8]]

function haze(ctx, width, height, stops) {
  const shade = ctx.createLinearGradient(0, 0, 0, height)
  for (const [offset, color] of stops) shade.addColorStop(offset, color)
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)
}

function shadow(ctx, { x, groundY, width, height }) {
  ctx.fillStyle = '#28211838'
  ctx.beginPath()
  ctx.ellipse(x, groundY, width * .49, height * .061, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#241c1548'
  ctx.beginPath()
  ctx.ellipse(x, groundY - height * .015, width * .43, height * .037, 0, 0, Math.PI * 2)
  ctx.fill()
}

function smokeSprite() {
  const sprite = document.createElement('canvas')
  sprite.width = 12
  sprite.height = 8
  const ctx = sprite.getContext('2d')
  ctx.fillStyle = '#8e7e62'
  for (const [y, [left, right]] of smokeRows.entries()) ctx.fillRect(left, y, right - left, 1)
  return sprite
}

/** Visual dressing for the fixed Neretva camera, drawn between its background and actors. */
export default class Battlefield {
  constructor() {
    this.crater = new Image()
    this.crater.addEventListener('load', () => {
      this.dirty = true
    })
    this.crater.src = `${assets.images}game-ready/scenery/neretva-crater.webp`
    this.layer = document.createElement('canvas')
    this.posts = []
    this.impacts = []
    this.time = 0
    this.dirty = true
  }

  setFormation(posts) {
    this.posts = posts
    this.impacts.length = 0
    this.time = 0
    this.dirty = true
  }

  impact(point) {
    this.impacts.push({ ...point, at: this.time })
    if (this.impacts.length > maxImpacts) this.impacts.shift()
    this.dirty = true
  }

  update(dt) {
    this.time += dt
  }

  drawCrater(ctx, x, y, width) {
    const height = width * this.crater.naturalHeight / this.crater.naturalWidth
    ctx.drawImage(this.crater, x - width / 2, y - height / 2, width, height)
  }

  prepare(width, height) {
    const canvas = this.layer
    if (canvas.width === width && canvas.height === height && !this.dirty) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (this.posts.length) {
      haze(ctx, width, height, [[0, '#a5b5c544'], [.18, '#98a6af21'], [.48, '#98a6af00'],
        [.71, '#26201200'], [1, '#26201263']])
      if (this.crater.naturalWidth) {
        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.globalAlpha = .7
        for (const [x, y, size] of scars)
          this.drawCrater(ctx, width * x, height * y, Math.min(width, height * 1.7) * size)
        ctx.globalAlpha = .9
        for (const { x, y } of this.impacts) this.drawCrater(ctx, x, y, Math.min(width * .18, height * .23))
        ctx.restore()
      }
      for (const { cover } of this.posts) shadow(ctx, cover)
    } else
      haze(ctx, width, height, [[0, '#778a9c30'], [.26, '#b0bac322'], [.56, '#95a8b300'],
        [.80, '#241d1800'], [1, '#241d187d']])
    this.dirty = false
  }

  render(ctx, width, height) {
    if (!width || !height) return
    this.prepare(width, height)
    ctx.drawImage(this.layer, 0, 0)
    if (!this.posts.length) {
      ctx.save()
      ctx.fillStyle = '#b4d2ca'
      for (const [i, [x, y, length]] of ripples.entries()) {
        const wave = Math.sin(this.time * 1.7 + i * 1.9)
        ctx.globalAlpha = .11 + wave * .065
        ctx.fillRect(Math.round(width * (x + .004 * wave)), Math.round(height * y),
          Math.round(width * length), height >= 850 ? 2 : 1)
      }
      ctx.restore()
    }
    if (!this.impacts.some(({ at }) => this.time - at < smokeLifetime)) return
    this.smoke ??= smokeSprite()
    ctx.save()
    ctx.imageSmoothingEnabled = false
    const markWidth = Math.min(width * .18, height * .23)
    for (const { x, y, at } of this.impacts) {
      const age = (this.time - at) / smokeLifetime
      if (age >= 1) continue
      for (let i = 0; i < 6; i++) {
        const drift = age * (i + 1) * markWidth * .14
        const spread = (.13 + .18 * age) * markWidth
        const px = Math.round(x + drift - spread * (.55 - i % 3 * .4))
        const py = Math.round(y - drift * 1.25 - spread * ((i % 2) * .28 + .6))
        ctx.globalAlpha = (1 - age) * (.31 - .036 * i)
        ctx.drawImage(this.smoke, px, py, Math.round(spread), Math.round(spread * .67))
      }
    }
    ctx.restore()
  }
}
