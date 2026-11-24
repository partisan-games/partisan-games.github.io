import imageReady from '/core/io/imageReady.js'
import { cameraAt, duration, soldierAt, soldiers, tank } from './Battle.js'
import Meadow, { focalLength, height, horizon, width } from './Meadow.js'

const infantry = '/assets/images/armies/nemci/vojnici/'
const art = {
  gunner: `${infantry}vojnik-26.png`,
  rifleman: `${infantry}vojnik-27.png`,
  riflemanLow: `${infantry}vojnik-19.png`,
  tank: '/assets/images/armies/panzer3.png',
  grass: '/assets/images/textures/terrain/grass.jpg',
}

const spriteBaselines = { gunner: 65, rifleman: 69 }

function maskSpriteGround(image) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  // The meadow supplies the ground. Keep the neutral colours of boots and tracks.
  const start = image.height - 15
  const pixels = ctx.getImageData(0, start, image.width, 15)
  const { data } = pixels
  for (let i = 0; i < data.length; i += 4) {
    const blue = data[i + 2]
    if (data[i + 1] - blue > 16 && data[i] - blue > 4) data[i + 3] = 0
  }
  // Discard detached outlines left behind by the masked grass.
  const connected = new Uint8Array(pixels.width * pixels.height)
  const pending = Array.from({ length: pixels.width }, (_, index) => index)
  while (pending.length) {
    const index = pending.pop()
    if (connected[index] || !data[index * 4 + 3]) continue
    connected[index] = 1
    const x = index % pixels.width
    const y = Math.floor(index / pixels.width)
    for (let dy = Math.max(0, y - 1); dy <= Math.min(pixels.height - 1, y + 1); dy++)
      for (let dx = Math.max(0, x - 1); dx <= Math.min(pixels.width - 1, x + 1); dx++)
        pending.push(dy * pixels.width + dx)
  }
  for (let i = 0; i < connected.length; i++)
    if (!connected[i]) data[i * 4 + 3] = 0
  ctx.putImageData(pixels, 0, start)
  return canvas
}

export default class BattleView {
  constructor(canvas) {
    this.frame = canvas.getContext('2d')
    this.vignette = this.frame.createRadialGradient(width * .45, height * .46, 117, width * .45, height * .46, 285)
    this.vignette.addColorStop(0, '#15212800')
    this.vignette.addColorStop(1, '#15212838')
  }

  async init() {
    const images = await Promise.all(Object.entries(art).map(async([name, src]) => {
      const image = new Image()
      image.src = src
      return [name, await imageReady(image)]
    }))
    this.art = Object.fromEntries(images)
    this.meadow = new Meadow(this.frame, this.art.grass)
    for (const kind of ['gunner', 'rifleman', 'tank']) this.art[kind] = maskSpriteGround(this.art[kind])
  }

  render(elapsed) {
    if (!this.art) return

    const { frame } = this
    const { width: canvasWidth, height: canvasHeight } = frame.canvas
    const time = elapsed % duration
    const scale = Math.min(canvasWidth / width, canvasHeight / height)
    if (scale <= 0) return

    const x = (canvasWidth - width * scale) / 2
    const y = (canvasHeight - height * scale) / 2
    frame.save()
    frame.setTransform(scale, 0, 0, scale, x, y)
    frame.beginPath()
    frame.rect(0, 0, width, height)
    frame.clip()
    frame.imageSmoothingEnabled = true
    this.drawBattle(time, scale)
    frame.fillStyle = this.vignette
    frame.fillRect(0, 0, width, height)

    const fade = Math.max(0, 1 - time / .21, 1 - (duration - time) / .3)
    if (fade > 0) {
      frame.fillStyle = `rgba(12, 18, 23, ${fade})`
      frame.fillRect(0, 0, width, height)
    }

    frame.restore()
  }

  drawBattle(time, scale) {
    const camera = cameraAt(time)
    this.meadow.draw(camera, scale)
    this.meadow.drawTufts(camera, time, 4.5, 28)
    const tankX = tank.x + tank.speed * time
    const units = [
      ...soldiers.map(soldier => soldierAt(soldier, time)),
      { kind: 'tank', x: tankX, z: tank.z, height: tank.height, lift: 0 },
      { kind: 'rifleman', x: tankX + .55, z: tank.z - .02, height: .94, lift: 1.61 },
    ]
    units.sort((a, b) => b.z - a.z)
    for (const unit of units) this.drawActor(unit, camera)
    this.meadow.drawTufts(camera, time, .65, 4.5)
  }

  drawActor(unit, [cameraX, cameraY, cameraZ]) {
    const distance = unit.z - cameraZ
    if (distance <= .32) return

    const scale = focalLength / distance
    const image = this.art[unit.kind]
    const size = unit.height * scale
    const w = image.width * size / image.height
    const anchorX = width / 2 + (unit.x - cameraX) * scale
    const groundY = horizon + cameraY * scale
    const sourceHeight = spriteBaselines[unit.kind] ?? image.height
    const spriteHeight = size * sourceHeight / image.height
    const x = anchorX - w * .37
    const y = groundY - unit.lift * scale - spriteHeight
    if (x + w <= 0 || x >= width || y + size <= 0 || y >= height) return

    if (unit.lift < .024) {
      const radius = unit.kind === 'tank' ? w * .49 : scale * .36
      this.frame.fillStyle = '#28302149'
      this.frame.beginPath()
      this.frame.ellipse(anchorX + radius * .28, groundY - 1, radius, radius * .20, 0, 0, 2 * Math.PI)
      this.frame.fill()
    }
    this.frame.imageSmoothingEnabled = false
    this.frame.drawImage(image, 0, 0, image.width, sourceHeight, x, y, w, spriteHeight)
    this.frame.imageSmoothingEnabled = true

    if (unit.shotAge < .42) {
      const muzzleX = unit.shotX + unit.height * image.width / image.height * .60
      const muzzleY = unit.height * .69
      this.drawShot(width / 2 + (muzzleX - cameraX) * scale, horizon + (cameraY - muzzleY) * scale, scale, unit.shotAge)
    }
  }

  drawShot(x, y, scale, age) {
    const ctx = this.frame
    if (age < .035) {
      ctx.fillStyle = '#e6d8ad'
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(scale * .055)), Math.max(1, Math.round(scale * .021)))
    }
    const smokeX = x + age * scale * .36
    const smokeY = y - age * scale * .32
    const radius = scale * (.025 + age * .23)
    ctx.save()
    ctx.globalAlpha = (1 - age / .42) * .25
    const smoke = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, radius)
    smoke.addColorStop(0, '#bac0c9')
    smoke.addColorStop(1, '#bac0c900')
    ctx.fillStyle = smoke
    ctx.fillRect(smokeX - radius, smokeY - radius, radius * 2, radius * 2)
    ctx.restore()
  }

}
