import Renderer2D from '/core/Renderer2D.js'
/** How the plane looks: seconds between solid and faint while it cannot be hit; the propeller seen edge on, in shares of the plane's width and height, and seconds per flicker. */
export const look = { blinkTime: .1, propeller: { span: .29, nose: .066, frameTime: .04 } }

/** How the blades flicker as they turn: a share of their span and how solid they are. */
const propellerFrames = [{ span: 1, alpha: .55 }, { span: .82, alpha: .35 }, { span: .92, alpha: .45 }]

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
    const faint = plane.shield > 0 && Math.floor(plane.shield / look.blinkTime) % 2
    renderer.ctx.save()
    if (faint) renderer.ctx.globalAlpha = .3
    renderer.drawObject(plane)
    if (plane.shown) this.drawPropeller(renderer.ctx, plane)
    renderer.ctx.restore()
  }

  /** The turning blades, seen edge on: a bar at the nose that flickers between a few lengths. */
  drawPropeller(ctx, plane) {
    const { propeller } = look
    const frame = propellerFrames[Math.floor(this.propellerTime / propeller.frameTime) % propellerFrames.length]
    const half = plane.width * propeller.span * frame.span / 2
    const thickness = Math.max(plane.height * .008, 1.5)
    ctx.save()
    ctx.translate(plane.x, plane.y)
    ctx.rotate(plane.angle)
    ctx.scale(plane.scaleX, plane.scaleY)
    ctx.translate(0, plane.height * (propeller.nose - .5))
    ctx.globalAlpha *= frame.alpha
    ctx.fillStyle = '#1c1c1a'
    ctx.fillRect(-half, -thickness / 2, half * 2, thickness)
    ctx.fillStyle = '#d6aa28'
    ctx.fillRect(-half, -thickness / 2, half * .12, thickness)
    ctx.fillRect(half * .88, -thickness / 2, half * .12, thickness)
    ctx.restore()
  }
}
