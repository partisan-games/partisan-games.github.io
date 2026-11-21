import { origins } from './constants.js'
import { bodyImage } from './actor/wreckView.js'
import Body from './gameplay/bodies/Body.js'

const poravnajNiz = niz => niz.flatMap(predmet =>
  [predmet, ...(predmet.children ? poravnajNiz(predmet.children) : [])]
)

export default class Renderer2D {
  constructor({ canvas }) {
    if (Renderer2D.instance) return Renderer2D.instance
    Renderer2D.instance = this

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cameraX = this.cameraY = 0
  }

  clear({ background, backgroundColor } = {}) {
    if (background)
      background.render()
    else if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    } else
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawShape(predmet) {
    this.ctx.fillStyle = 'black'
    if (predmet.origin === origins.center)
      this.ctx.fillRect(-predmet.width / 2, -predmet.height / 2, predmet.width, predmet.height)
    else if (predmet.origin === origins.topLeft)
      this.ctx.fillRect(0, 0, predmet.width, predmet.height)
    else if (predmet.origin === origins.bottomRight)
      this.ctx.fillRect(-predmet.width, -predmet.height, predmet.width, predmet.height)
  }

  drawFrame(predmet) {
    const image = bodyImage(predmet)
    if (predmet.origin === origins.center)
      this.ctx.drawImage(image, -predmet.width / 2, -predmet.height / 2, predmet.width, predmet.height)
    else if (predmet.origin === origins.topLeft)
      this.ctx.drawImage(image, 0, 0, predmet.width, predmet.height)
    else if (predmet.origin === origins.bottomRight)
      this.ctx.drawImage(image, -predmet.width, -predmet.height, predmet.width, predmet.height)
  }

  addShadow(predmet) {
    if (predmet.shadow) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      this.ctx.shadowOffsetX = 10
      this.ctx.shadowOffsetY = 10
    }
  }

  drawObject(predmet) {
    if (!predmet.shown) return

    this.ctx.save()
    this.addShadow(predmet)
    this.ctx.translate(predmet.x, predmet.y)
    this.ctx.rotate(predmet.angle)
    this.ctx.scale(predmet.flipY, predmet.flipX)
    this.ctx.scale(predmet.scaleX, predmet.scaleY)

    if (!predmet.debug) predmet.crew?.renderLocal?.(this.ctx, predmet)
    if (!predmet.image || predmet.debug)
      this.drawShape(predmet)
    else
      this.drawFrame(predmet)

    if (!predmet.debug) predmet.propellers?.renderLocal(this.ctx, predmet)

    this.ctx.restore()
    // A separately registered flame drawable controls its own layer and must not be drawn twice.
    if (predmet.burning && !predmet.flameLayer) predmet.flame.render(predmet.smoky)
  }

  drawObjects(children) {
    this.ctx.save()
    this.ctx.translate(-this.cameraX, -this.cameraY)

    // a view draws itself with the context and the camera; a body has nothing to draw
    const camera = { x: this.cameraX, y: this.cameraY, width: this.canvas.width, height: this.canvas.height }
    poravnajNiz(children)
      .filter(predmet => !(predmet instanceof Body))
      .sort((a, b) => (b.layer ?? b.position?.z) - (a.layer ?? a.position?.z))
      .forEach(predmet => predmet.render ? predmet.render(this.ctx, camera) : this.drawObject(predmet))

    this.ctx.restore()
  }
}
