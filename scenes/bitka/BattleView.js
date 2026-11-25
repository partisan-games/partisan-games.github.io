import imageReady from '/core/io/imageReady.js'
import AdvanceSprite from '/core/actor/AdvanceSprite.js'
import { cameraAt, soldierAt, soldiers, tankAt, tanks } from './Battle.js'
import Meadow, { focalLength, height, horizon, width } from './Meadow.js'
import { promoAt } from './PromoTimeline.js'
import drawPromoLogo from './PromoLogo.js'

export default class BattleView {
  constructor(canvas) {
    this.frame = canvas.getContext('2d')
    this.vignette = this.frame.createRadialGradient(width * .45, height * .46, 117, width * .45, height * .46, 285)
    this.vignette.addColorStop(0, '#15212800')
    this.vignette.addColorStop(1, '#15212838')
  }

  async init() {
    const grass = new Image()
    grass.src = '/assets/images/textures/terrain/grass.jpg'
    this.sprites = Object.fromEntries([...new Set(soldiers.map(soldier => soldier.kind)), 'tank'].map(kind => [kind, new AdvanceSprite(kind)]))
    const sheets = Object.values(this.sprites).flatMap(sprite => sprite.children)
    await Promise.all([imageReady(grass), ...sheets.map(sheet => imageReady(sheet.image, sheet.imageLoaded)),
      document.fonts?.load('28px "Press Start 2P"')])
    this.meadow = new Meadow(this.frame, grass)
  }

  render(elapsed) {
    if (!this.meadow) return

    const { frame } = this
    const { width: canvasWidth, height: canvasHeight } = frame.canvas
    const { battleTime, showBattle, logoOpacity, fade } = promoAt(elapsed)
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
    if (showBattle) {
      this.drawBattle(battleTime, scale)
      frame.fillStyle = this.vignette
      frame.fillRect(0, 0, width, height)
    }
    if (logoOpacity > 0) {
      frame.fillStyle = `rgba(12, 18, 23, ${logoOpacity})`
      frame.fillRect(0, 0, width, height)
      drawPromoLogo(frame, logoOpacity)
    }

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
    const units = [
      ...soldiers.map(soldier => soldierAt(soldier, time)),
      ...tanks.map(tank => tankAt(tank, time)),
    ]
    units.sort((a, b) => b.z - a.z)
    for (const unit of units) this.drawActor(unit, camera)
    this.meadow.drawTufts(camera, time, .65, 4.5)
  }

  drawActor(unit, [cameraX, cameraY, cameraZ]) {
    const distance = unit.z - cameraZ
    if (distance <= .32) return

    const scale = focalLength / distance
    const sprite = this.sprites[unit.kind]
    const w = sprite.worldWidth * scale
    const anchorX = width / 2 + (unit.x - cameraX) * scale
    const groundY = horizon + cameraY * scale
    const { anchor, width: frameWidth } = sprite.sheet.art
    const x = anchorX - w * anchor.x / frameWidth
    if (x + w <= 0 || x >= width || groundY <= 0 || groundY - sprite.height * scale >= height) return

    const radius = unit.kind === 'tank' ? w * .49 : scale * .36
    this.frame.fillStyle = '#28302149'
    this.frame.beginPath()
    this.frame.ellipse(anchorX + radius * .28, groundY - 1, radius, radius * .20, 0, 0, 2 * Math.PI)
    this.frame.fill()
    sprite.draw(this.frame, { name: unit.pose, time: unit.poseTime, x: anchorX, y: groundY, scale,
      crewTime: unit.crewTime, crewVisible: unit.crewVisible })
    if (unit.shotAge < .42)
      sprite.drawShot(this.frame, { name: unit.shot, age: unit.shotAge, x: width / 2 + (unit.shotX - cameraX) * scale,
        y: groundY, scale })
  }
}
