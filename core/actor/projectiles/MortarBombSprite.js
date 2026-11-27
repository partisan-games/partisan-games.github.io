import CannonballSprite from './CannonballSprite.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import { mortarShape } from '/core/gameplay/bodies/artillery/Mortar.js'

/** Where the bomb's picture, pointing right with its nose, is held: its middle, in its pixels. */
const middle = { x: 16, y: 9 }

/** A mortar bomb sounds and bursts as a cannonball, but is drawn as the finned bomb, its nose along its flight. */
export default class MortarBombSprite extends CannonballSprite {
  constructor(bomb, projection) {
    super(bomb, projection)
    this.picture = new GameObject2D('game-ready/artiljerija/minobacac/mina.webp')
  }

  render(ctx) {
    const { image } = this.picture
    if (!this.visible || !image.naturalWidth) return
    const { ball, projection } = this
    const scale = projection.length(mortarShape.pixel)
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(Math.atan2(-ball.vy, ball.vx))
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, -middle.x * scale, -middle.y * scale, image.naturalWidth * scale, image.naturalHeight * scale)
    ctx.restore()
  }
}
