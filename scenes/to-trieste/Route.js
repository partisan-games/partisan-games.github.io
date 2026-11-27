import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'
import imageReady from '/core/io/imageReady.js'

export const stages = ['lika', 'senj', 'rijeka', 'trst'].map(id => ({ id }))

const TILE_WIDTH = 512
const CLOUD_SPACING = 1300
const CLOUDS = [
  { x: 90, height: .28, scale: .7, alpha: .48, shape: 0 },
  { x: 410, height: .36, scale: 1, alpha: .65, shape: 1 },
  { x: 760, height: .23, scale: .8, alpha: .5, shape: 1 },
  { x: 1080, height: .32, scale: 1.1, alpha: .6, shape: 0 },
]
const CLOUD_COLORS = ['#b5c5c5', '#c9d4cf', '#dce2d7']
// Broad stepped clusters, with a flat shaded underside rather than spherical lobes.
const CLOUD_SHAPES = [
  [
    [[0, 32], [24, 26], [52, 26], [52, 20], [88, 20], [88, 14], [138, 14], [138, 20], [178, 20], [178, 26], [224, 26], [224, 30], [260, 34], [236, 38], [182, 40], [78, 40], [30, 36]],
    [[16, 28], [54, 24], [74, 24], [74, 16], [100, 16], [100, 8], [144, 8], [144, 12], [166, 12], [166, 20], [204, 20], [204, 24], [240, 30], [182, 32], [82, 30]],
    [[76, 18], [100, 18], [100, 10], [140, 10], [140, 14], [160, 14], [160, 20], [196, 24], [142, 24], [112, 20]],
  ],
  [
    [[0, 34], [36, 28], [68, 28], [68, 24], [124, 24], [124, 20], [172, 20], [172, 26], [214, 26], [214, 30], [260, 34], [238, 38], [164, 40], [54, 38]],
    [[22, 28], [60, 24], [86, 24], [86, 18], [132, 18], [132, 10], [166, 10], [166, 16], [190, 16], [190, 24], [224, 28], [196, 32], [112, 30]],
    [[92, 20], [134, 20], [134, 12], [162, 12], [162, 18], [186, 18], [186, 24], [152, 24]],
  ],
]
const VILLAGE_DEPTHS = [
  { speed: .32, setback: 66, scale: .6, alpha: .65, trees: [50, 300], houses: [] },
  { speed: .45, setback: 40, scale: .8, alpha: .78, trees: [1200], houses: [] },
  { speed: .6, setback: 15, scale: 1, alpha: .88, trees: [100], houses: [[0, 500], [1, 700], [2, 930]] },
]

/** Decorative scenery has no collision targets or simulation of its own. */
export default class Route extends GameObject2D {
  constructor({ groundY, distance, length }) {
    super(null)
    this.groundY = groundY
    this.distance = distance
    this.stageLength = length / stages.length
    this.roadHeight = Math.min(140, Math.max(64, canvas2d.height * .16))
    this.forest = new GameObject2D('game-ready/scenery/shumarak.webp', { width: 250, visible: false })
    this.buildings = [
      new GameObject2D('game-ready/scenery/do-trsta/kuca-07.webp', { width: 72, visible: false }),
      new GameObject2D('game-ready/scenery/do-trsta/kuca-04.webp', { width: 90, visible: false }),
      new GameObject2D('game-ready/scenery/crkva-do-trsta.webp', { width: 78, visible: false }),
    ]
    this.children.push(this.forest, ...this.buildings)
    this.clouds = []
    this.road = null
    this.sprites = new Map()
    this.alignRoad(groundY)
  }

  async loaded() {
    await Promise.all(this.children.map(sprite => imageReady(sprite.image, sprite.imageLoaded)))
    this.prepare()
  }

  stageAt(distance) {
    return stages[Math.min(stages.length - 1, Math.floor(distance / this.stageLength))]
  }

  /** Paints the sky, the road and the faded scenery once their pictures have loaded. */
  prepare() {
    this.road = this.createRoad()
    this.clouds = CLOUD_SHAPES.map(profile => this.createCloud(profile))
    this.sky = ctx.createLinearGradient(0, 0, 0, this.groundY)
    this.sky.addColorStop(0, '#9db8bd')
    this.sky.addColorStop(.8, '#d0d8c9')
    this.sky.addColorStop(1, '#e0dfc4')
    for (const sprite of this.children) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(sprite.width)
      canvas.height = Math.ceil(sprite.height)
      const paint = canvas.getContext('2d')
      paint.filter = 'saturate(55%) contrast(88%)'
      paint.drawImage(sprite.image, 0, 0, canvas.width, canvas.height)
      this.sprites.set(sprite, canvas)
    }
  }

  /** Lays the road under the line the units stand on, in pixels. */
  alignRoad(groundLine) {
    this.groundY = groundLine - this.roadHeight / 2 + 3
  }

  get roadTop() {
    return this.groundY - 3
  }

  createCloud(profile) {
    const cloud = document.createElement('canvas')
    cloud.width = 260
    cloud.height = 44
    const paint = cloud.getContext('2d')
    for (const [index, points] of profile.entries()) {
      paint.fillStyle = CLOUD_COLORS[index]
      paint.beginPath()
      paint.moveTo(...points[0])
      for (const point of points.slice(1)) paint.lineTo(...point)
      paint.closePath()
      paint.fill()
    }
    return cloud
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
    for (let x = -24; x <= canvas2d.width + 24; x += 24) {
      const worldX = x + distance
      const y = base + Math.sin(worldX / 240) * height + Math.sin(worldX / 93) * height * .25
      ctx.lineTo(x, y)
    }
    ctx.lineTo(canvas2d.width + 24, this.groundY)
    ctx.closePath()
    ctx.fill()
  }

  drawSprite(sprite, x, bottom, scale = 1) {
    if (!sprite.image.naturalWidth || !Number.isFinite(sprite.height)) return
    ctx.drawImage(this.sprites.get(sprite) || sprite.image, x, bottom - sprite.height * scale, sprite.width * scale, sprite.height * scale)
  }

  village(distance) {
    const tileWidth = 1600
    ctx.save()
    for (const depth of VILLAGE_DEPTHS) {
      const phase = distance * depth.speed % tileWidth
      const bottom = this.groundY - depth.setback
      ctx.globalAlpha = depth.alpha
      for (let origin = -tileWidth - phase; origin < canvas2d.width; origin += tileWidth) {
        for (const x of depth.trees) this.drawSprite(this.forest, origin + x, bottom + 3, depth.scale)
        for (const [index, x] of depth.houses) {
          const sprite = this.buildings[index]
          this.drawSprite(sprite, origin + x, bottom, depth.scale)
          if (depth.scale !== 1) continue
          ctx.strokeStyle = '#7f8062'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          // Short fences frame each house.
          for (const start of [origin + x - 35, origin + x + sprite.width + 5]) {
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
    for (let origin = -CLOUD_SPACING - phase; origin < canvas2d.width; origin += CLOUD_SPACING)
      for (const cloud of CLOUDS) {
        const image = this.clouds[cloud.shape]
        const x = origin + cloud.x
        const width = image.width * cloud.scale
        const height = image.height * cloud.scale
        if (x + width < 0 || x > canvas2d.width) continue
        ctx.globalAlpha = cloud.alpha
        ctx.drawImage(image, x, this.groundY * cloud.height - height, width, height)
      }

    ctx.restore()
  }

  render() {
    if (!this.road) return
    const distance = this.distance()
    const ground = this.groundY
    ctx.save()
    ctx.fillStyle = this.sky
    ctx.fillRect(0, 0, canvas2d.width, canvas2d.height)
    this.renderClouds(distance)
    this.ridge(distance * .1, ground - 120, 27, '#9ba99a')
    this.ridge(distance * .24, ground - 65, 20, '#7d9276')
    this.ridge(distance * .28, ground - 82, 5, '#87946d')
    this.village(distance)
    ctx.fillStyle = '#7c885b'
    ctx.fillRect(0, ground - 8, canvas2d.width, canvas2d.height - ground + 8)
    const phase = distance % TILE_WIDTH
    for (let x = -phase; x < canvas2d.width; x += TILE_WIDTH)
      ctx.drawImage(this.road, x, this.roadTop)
    ctx.fillStyle = '#596e43'
    const verge = this.roadHeight + this.roadTop
    ctx.fillRect(0, verge, canvas2d.width, 3)
    // Small tufts frame the road without crossing the aiming area.
    ctx.fillStyle = '#657b4d'
    for (let x = -(distance % 83); x < canvas2d.width; x += 83) {
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
