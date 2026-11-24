export const width = 480
export const height = 270
export const focalLength = 310
export const horizon = 156

const grassTones = ['#494c35', '#616344', '#79794a', '#939059', '#aba166']
const treeLayers = [
  { z: 273, color: '#7e8980', light: '#93988a', elevation: 11, roughness: 4 },
  { z: 164, color: '#686e58', light: '#787f65', elevation: 5, roughness: 2.4 },
  { z: 93, color: '#535b40', light: '#63694a', elevation: 3.1, roughness: 1.65 },
]

const mix = (a, b, factor) => a + (b - a) * factor
const smooth = value => value * value * (3 - 2 * value)
const clamp = value => Math.max(0, Math.min(1, value))

function random(x, y) {
  const bits = Math.imul(x ^ 0x3f45, 0x27d4eb2d) ^ Math.imul(y ^ 0x71d3, 0x165667b1)
  return ((bits ^ (bits >>> 15)) >>> 0) / 0x100000000
}

function noise(x, y) {
  const column = Math.floor(x)
  const row = Math.floor(y)
  const dx = smooth(x - column)
  const dy = smooth(y - row)
  return mix(mix(random(column, row), random(column + 1, row), dx),
    mix(random(column, row + 1), random(column + 1, row + 1), dx), dy)
}

function buffer(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas.getContext('2d')
}

function makeSky() {
  const margin = 20
  const ctx = buffer(width + margin * 2, horizon + 1)
  const shade = ctx.createImageData(ctx.canvas.width, ctx.canvas.height)
  for (let y = 0; y < shade.height; y++) {
    const vertical = smooth(y / horizon)
    for (let x = 0; x < shade.width; x++) {
      const cloudNoise = noise(x / 79, y / 18) * .63 + noise(x / 29, y / 7) * .26 + noise(x / 11, y / 3.3) * .11
      const cloud = clamp((cloudNoise - .40) * 3.2) * (1 - vertical * .68)
      const light = Math.exp(-((x - 121) ** 2 / 15500 + (y - 143) ** 2 / 2900))
      const grain = (random(x, y) - .5) * 3
      const offset = (y * shade.width + x) * 4
      shade.data[offset] = mix(65, 160, vertical) + cloud * 45 + light * 38 + grain
      shade.data[offset + 1] = mix(80, 172, vertical) + cloud * 43 + light * 25 + grain
      shade.data[offset + 2] = mix(100, 168, vertical) + cloud * 36 + light * 7 + grain
      shade.data[offset + 3] = 255
    }
  }
  ctx.putImageData(shade, 0, 0)
  return ctx.canvas
}

function makeGrass(image) {
  const ctx = buffer(image.width, image.height)
  ctx.drawImage(image, 0, 0)
  const { width: size, height: rows } = ctx.canvas
  const pixels = ctx.getImageData(0, 0, size, rows)
  for (let i = 0; i < size * rows; i++) {
    const x = i % size
    const y = Math.floor(i / size)
    const offset = i * 4
    const detail = (pixels.data[offset + 1] - 110) * .20
    const veins = (noise(x / 46, y / 37) - .5) * 26 + (random(x, y) - .5) * 6
    const warm = (noise(x / 102 + 3, y / 79) - .5) * 14
    pixels.data[offset] = 112 + detail + veins + warm
    pixels.data[offset + 1] = 116 + detail + veins
    pixels.data[offset + 2] = 71 + detail * .71 + veins * .66 - warm * .45
  }
  ctx.putImageData(pixels, 0, 0)
  return [1, 2, 4, 8, 16, 32].map(divisor => {
    const tile = buffer(size / divisor, rows / divisor)
    tile.imageSmoothingQuality = 'high'
    tile.drawImage(ctx.canvas, 0, 0, tile.canvas.width, tile.canvas.height)

    const atlas = buffer(size * 2, tile.canvas.height + 2)
    atlas.fillStyle = atlas.createPattern(tile.canvas, 'repeat')
    atlas.fillRect(0, 0, atlas.canvas.width, atlas.canvas.height)
    return { atlas: atlas.canvas, tileWidth: tile.canvas.width, tileHeight: tile.canvas.height }
  })
}

function makeTrees(layer) {
  const pixelsPerMetre = 4
  const ctx = buffer(2048, 88)
  const base = ctx.canvas.height - 2
  for (let x = 0; x < ctx.canvas.width; x++) {
    const worldX = (x - ctx.canvas.width / 2) / pixelsPerMetre
    const hill = noise(worldX * .045, layer.z)
    const canopy = noise(worldX * .41, layer.z + 1)
    const detail = noise(worldX * 1.5, layer.z - 1)
    const peak = Math.round((layer.elevation * (.51 + hill * .72) + layer.roughness * (canopy + detail * .45)) * pixelsPerMetre)
    ctx.fillStyle = layer.color
    ctx.fillRect(x, base - peak, 1, peak + 1 + Math.round(canopy * 2))
    ctx.fillStyle = layer.light
    ctx.fillRect(x, base - peak, 1, Math.max(1, Math.floor(detail * peak * .38)))
  }
  return { z: layer.z, image: ctx.canvas, pixelsPerMetre, base }
}

export default class Meadow {
  constructor(ctx, grass) {
    this.ctx = ctx
    this.sky = makeSky()
    this.grass = makeGrass(grass)
    this.trees = treeLayers.map(makeTrees)
  }

  draw(camera, screenScale) {
    const [x, , z] = camera
    this.ctx.drawImage(this.sky, -20 - x * .85 - z * .22, 0)
    this.drawGround(camera, screenScale)
    for (const layer of this.trees) this.drawTrees(layer, camera)
  }

  drawGround([cameraX, cameraY, cameraZ], screenScale) {
    const { ctx, grass } = this
    const tileMetres = 8
    ctx.fillStyle = '#858665'
    ctx.fillRect(0, horizon, width, height - horizon)

    // Sample a filtered texture level based on each screen row's footprint on the ground.
    const step = 1 / Math.min(3, screenScale)
    const depth = cameraY * focalLength
    const firstLevel = grass[0]
    for (let row = horizon + 4; row < height; row += step) {
      const offset = row + step * .5 - horizon
      const distance = depth / offset
      const projection = focalLength / distance
      const tile = tileMetres * projection
      const across = firstLevel.tileWidth * step / tile
      const forward = firstLevel.tileHeight * distance * step / (offset * tileMetres)
      const level = Math.min(grass.length - 1, Math.floor(Math.log2(Math.max(1, across, forward))))
      const { atlas, tileHeight, tileWidth } = grass[level]
      const u = (cameraX - width / (2 * projection)) / tileMetres
      const v = (cameraZ + distance) / tileMetres
      const sourceY = (v - Math.floor(v)) * tileHeight
      const atlasWidth = atlas.width * tile / tileWidth
      const start = -(u - Math.floor(u)) * tile
      for (let x = start; x < width; x += atlasWidth)
        ctx.drawImage(atlas, 0, sourceY, atlas.width, 1, x, row, atlasWidth, step * 1.02)
    }

    const haze = ctx.createLinearGradient(0, horizon, 0, height - 18)
    haze.addColorStop(0, '#b3b39a99')
    haze.addColorStop(.42, '#b3b39a20')
    haze.addColorStop(1, '#b3b39a00')
    ctx.fillStyle = haze
    ctx.fillRect(0, horizon, width, height - horizon)
  }

  drawTrees(layer, [cameraX, cameraY, cameraZ]) {
    const scale = focalLength / (layer.z - cameraZ)
    const ratio = scale / layer.pixelsPerMetre
    const w = layer.image.width * ratio
    const x = width / 2 - cameraX * scale - w / 2
    const y = horizon + cameraY * scale - layer.base * ratio
    this.ctx.drawImage(layer.image, x, y, w, layer.image.height * ratio)
  }

  drawTufts([cameraX, cameraY, cameraZ], time, near, far) {
    const { ctx } = this
    for (let row = Math.ceil(cameraZ + far); row >= Math.floor(cameraZ + near); row--) {
      const span = (row + 1 - cameraZ) * width / (2 * focalLength)
      for (let column = Math.floor(cameraX - span); column <= Math.ceil(cameraX + span); column++) {
        const cluster = random(column, row)
        if (cluster < .33) continue
        const z = row + random(column + 17, row + 41) - cameraZ
        if (z < near || z >= far) continue
        const scale = focalLength / z
        const x = width / 2 + (column + random(column - 16, row) - cameraX) * scale
        const y = horizon + cameraY * scale
        const reach = (.08 + cluster * .22) * scale
        if (y - reach >= height || x < -reach || x >= width + reach) continue
        const sway = Math.sin(time * 3.5 + row * .9 + column * .43)
        const lean = reach * (.28 + sway * .17)
        ctx.lineWidth = Math.max(.6, reach * .065)
        ctx.strokeStyle = grassTones[Math.floor(random(column, row + 90) * grassTones.length)]
        ctx.beginPath()
        ctx.moveTo(x - 1, y)
        ctx.quadraticCurveTo(x - reach * .15, y - reach * .48, x - reach * .35 + lean * .4, y - reach * .69)
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x, y - reach * .59, x + lean, y - reach)
        ctx.moveTo(x + 1, y)
        ctx.quadraticCurveTo(x + reach * .2, y - reach * .32, x + reach * .5 + lean, y - reach * .55)
        ctx.stroke()
      }
    }
  }
}
