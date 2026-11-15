import Predmet from '/core/actor/Predmet.js'
import platno, { ctx } from '/core/io/platno.js'
import { layers } from './CombatLayers.js'

const TILE_WIDTH = 512
const CLOUD_SPACING = 1300
const CLOUDS = [
  { x: 90, height: .28, scale: .7, alpha: .48 },
  { x: 410, height: .36, scale: 1, alpha: .65 },
  { x: 760, height: .23, scale: .8, alpha: .5 },
  { x: 1080, height: .32, scale: 1.1, alpha: .6 },
]
const VILLAGE_DEPTHS = [
  { speed: .32, setback: 66, scale: .6, alpha: .65, trees: [50, 300], houses: [] },
  { speed: .45, setback: 40, scale: .8, alpha: .78, trees: [1200], houses: [] },
  { speed: .6, setback: 15, scale: 1, alpha: .88, trees: [100], houses: [[0, 500], [1, 700], [2, 930]] },
]

/** Decorative scenery has no collision targets or simulation of its own. */
export default class Battlefield extends Predmet {
  constructor({ groundY, distance }) {
    super(null, { z: layers.background })
    this.groundY = groundY
    this.distance = distance
    this.roadHeight = Math.min(140, Math.max(64, platno.height * .16))
    this.forest = new Predmet('nature/shumarak.png', { sirina: 250, vidljiv: false })
    this.cloud = new Predmet('nature/oblak.gif', { sirina: 190, vidljiv: false })
    this.buildings = [
      new Predmet('buildings/kuca-07.png', { sirina: 72, vidljiv: false }),
      new Predmet('buildings/kuca-04.png', { sirina: 90, vidljiv: false }),
      new Predmet('buildings/crkva-01.png', { sirina: 78, vidljiv: false }),
    ]
    this.predmeti.push(this.forest, this.cloud, ...this.buildings)
    this.road = this.createRoad()
    this.sprites = new Map()
  }

  prepare() {
    this.sky = ctx.createLinearGradient(0, 0, 0, this.groundY)
    this.sky.addColorStop(0, '#9db8bd')
    this.sky.addColorStop(.8, '#d0d8c9')
    this.sky.addColorStop(1, '#e0dfc4')
    for (const sprite of this.predmeti) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(sprite.sirina)
      canvas.height = Math.ceil(sprite.visina)
      const paint = canvas.getContext('2d')
      paint.filter = 'saturate(55%) contrast(88%)'
      paint.drawImage(sprite.slika, 0, 0, canvas.width, canvas.height)
      this.sprites.set(sprite, canvas)
    }
  }

  alignRoad(centerY) {
    // Align scenery around the tank's ground contact without moving collision geometry.
    this.groundY = centerY - this.roadHeight / 2 + 3
  }

  get roadTop() {
    return this.groundY - 3
  }

  createRoad() {
    const tile = document.createElement('canvas')
    tile.width = TILE_WIDTH
    tile.height = Math.ceil(this.roadHeight)
    const paint = tile.getContext('2d')
    const gradient = paint.createLinearGradient(0, 0, 0, tile.height)
    gradient.addColorStop(0, '#a29a79')
    gradient.addColorStop(.35, '#b5a784')
    gradient.addColorStop(1, '#8d8968')
    paint.fillStyle = gradient
    paint.fillRect(0, 0, tile.width, tile.height)
    // Deterministic texture does not consume the combat's random sequence.
    for (let i = 0; i < 95; i++) {
      const x = (i * 73 + 17) % tile.width
      const y = (i * 37 + 11) % tile.height
      paint.fillStyle = i % 3 ? '#c2b492' : '#817e64'
      paint.fillRect(x, y, 2 + i % 4, 1)
    }
    paint.fillStyle = '#817f6330'
    for (const y of [tile.height * .25, tile.height * .65]) {
      paint.fillRect(0, y, tile.width, 3)
      for (let x = 0; x < tile.width; x += 16) paint.fillRect(x, y - 2, 5, 7)
    }
    return tile
  }

  ridge(distance, base, height, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    for (let x = -24; x <= platno.width + 24; x += 24) {
      const worldX = x + distance
      const y = base + Math.sin(worldX / 240) * height + Math.sin(worldX / 93) * height * .25
      ctx.lineTo(x, y)
    }
    ctx.lineTo(platno.width + 24, this.groundY)
    ctx.closePath()
    ctx.fill()
  }

  drawSprite(sprite, x, bottom, scale = 1) {
    if (!sprite.slika.naturalWidth || !Number.isFinite(sprite.visina)) return
    ctx.drawImage(this.sprites.get(sprite) || sprite.slika, x, bottom - sprite.visina * scale, sprite.sirina * scale, sprite.visina * scale)
  }

  village(distance) {
    const tileWidth = 1600
    ctx.save()
    for (const depth of VILLAGE_DEPTHS) {
      const phase = distance * depth.speed % tileWidth
      const bottom = this.groundY - depth.setback
      ctx.globalAlpha = depth.alpha
      for (let origin = -tileWidth - phase; origin < platno.width; origin += tileWidth) {
        for (const x of depth.trees) this.drawSprite(this.forest, origin + x, bottom + 3, depth.scale)
        for (const [index, x] of depth.houses) {
          const sprite = this.buildings[index]
          this.drawSprite(sprite, origin + x, bottom, depth.scale)
          if (depth.scale !== 1) continue
          ctx.strokeStyle = '#7f8062'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          // Short fences frame each house.
          for (const start of [origin + x - 35, origin + x + sprite.sirina + 5]) {
            ctx.moveTo(start, bottom - 7)
            ctx.lineTo(start + 30, bottom - 7)
            for (let post = start; post <= start + 30; post += 10) {
              ctx.moveTo(post, bottom)
              ctx.lineTo(post, bottom - 13)
            }
          }
          ctx.stroke()
        }
      }
    }
    ctx.restore()
  }

  renderClouds(distance) {
    const phase = distance * .04 % CLOUD_SPACING
    ctx.save()
    for (let origin = -CLOUD_SPACING - phase; origin < platno.width; origin += CLOUD_SPACING) {
      for (const cloud of CLOUDS) {
        const x = origin + cloud.x
        const width = this.cloud.sirina * cloud.scale
        if (x + width < 0 || x > platno.width) continue
        ctx.globalAlpha = cloud.alpha
        this.drawSprite(this.cloud, x, this.groundY * cloud.height, cloud.scale)
      }
    }
    ctx.restore()
  }

  render() {
    const distance = this.distance()
    const ground = this.groundY
    ctx.save()
    ctx.fillStyle = this.sky
    ctx.fillRect(0, 0, platno.width, platno.height)
    this.renderClouds(distance)
    this.ridge(distance * .1, ground - 120, 27, '#9ba99a')
    this.ridge(distance * .24, ground - 65, 20, '#7d9276')
    this.ridge(distance * .28, ground - 82, 5, '#87946d')
    this.village(distance)
    ctx.fillStyle = '#7c885b'
    ctx.fillRect(0, ground - 8, platno.width, platno.height - ground + 8)
    const phase = distance % TILE_WIDTH
    for (let x = -phase; x < platno.width; x += TILE_WIDTH)
      ctx.drawImage(this.road, x, this.roadTop)
    ctx.fillStyle = '#596e43'
    const verge = this.roadHeight + this.roadTop
    ctx.fillRect(0, verge, platno.width, 3)
    // Small tufts frame the road without crossing the aiming area.
    ctx.fillStyle = '#657b4d'
    for (let x = -(distance % 83); x < platno.width; x += 83) {
      ctx.beginPath()
      ctx.moveTo(x, this.roadTop)
      ctx.lineTo(x + 3, ground - 11)
      ctx.lineTo(x + 6, ground - 4)
      ctx.lineTo(x + 10, ground - 8)
      ctx.lineTo(x + 13, this.roadTop)
      ctx.fill()
    }
    ctx.restore()
  }
}
