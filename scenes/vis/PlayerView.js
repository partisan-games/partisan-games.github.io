import Renderer2D from '/core/Renderer2D.js'
import { settings } from './settings.js'

const { blinkTime, propeller } = settings.player

/** How the player plane looks: it blinks while it cannot be hit, and its propeller turns. No game rules. */
export default class PlayerView {
  constructor() {
    this.propellerTime = 0
  }

  update(dt) {
    this.propellerTime += dt
  }

  render(plane) {
    const renderer = Renderer2D.instance
    const faint = plane.shield > 0 && Math.floor(plane.shield / blinkTime) % 2
    renderer.ctx.save()
    if (faint) renderer.ctx.globalAlpha = .3
    renderer.crtaPredmet(plane)
    if (plane.prikazan) this.drawPropeller(renderer.ctx, plane)
    renderer.ctx.restore()
  }

  /** The turning blades, seen edge on: a bar at the nose that flickers between a few lengths. */
  drawPropeller(ctx, plane) {
    const { frames, frameTime } = propeller
    const frame = frames[Math.floor(this.propellerTime / frameTime) % frames.length]
    const half = plane.sirina * propeller.span * frame.span / 2
    const thickness = Math.max(plane.visina * .008, 1.5)
    ctx.save()
    ctx.translate(plane.x, plane.y)
    ctx.rotate(plane.ugao)
    ctx.scale(plane.scaleX, plane.scaleY)
    ctx.translate(0, plane.visina * (propeller.nose - .5))
    ctx.globalAlpha *= frame.alpha
    ctx.fillStyle = '#1c1c1a'
    ctx.fillRect(-half, -thickness / 2, half * 2, thickness)
    ctx.fillStyle = '#d6aa28'
    ctx.fillRect(-half, -thickness / 2, half * .12, thickness)
    ctx.fillRect(half * .88, -thickness / 2, half * .12, thickness)
    ctx.restore()
  }
}
