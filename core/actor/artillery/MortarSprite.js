import BodySprite from '/core/actor/BodySprite.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import MortarBombSprite from '/core/actor/projectiles/MortarBombSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { mortarShape } from '/core/gameplay/bodies/artillery/Mortar.js'

const folder = 'game-ready/artiljerija/minobacac/'

/**
 * How a mortar body looks and sounds in 2D: its base plate, its tube turned at its foot to its elevation, the bipod
 * under the tube, all drawn facing right and mirrored when it faces left; the bang of a shot, its fire when it burns,
 * and its bombs. Destroyed, its tube lies on the ground by the plate. It only reads the body.
 */
export default class MortarSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, folder + 'cev.webp', { projection, camera, flammable: true })
    this.bipod = new GameObject2D(folder + 'dvonozac.webp')
    this.plate = new GameObject2D(folder + 'ploca.webp')
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .7, profile: 'cannon', spatial: { getPosition: () => this.muzzle } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.update(0)
  }

  get muzzle() {
    return this.projection.point(this.body.muzzle)
  }

  get burning() {
    return this.flammable && this.body.burning
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.shotsFired > this.shotsSeen) this.shotSound.play()
    this.shotsSeen = body.shotsFired
    this.syncViews(body.shells.projectiles, bomb => new MortarBombSprite(bomb, this.projection))
  }

  /** Draws `image` with its point `held`, in its pixels, at the world point `at`, turned up by `angle`. */
  drawPart(ctx, image, held, at, angle = 0) {
    if (!image.naturalWidth) return
    const { projection, body } = this
    const { x, y } = projection.point(at)
    const scale = projection.length(mortarShape.pixel)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(body.forward, 1)
    ctx.rotate(-angle)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, -held.x * scale, -held.y * scale, image.naturalWidth * scale, image.naturalHeight * scale)
    ctx.restore()
  }

  render(ctx) {
    if (!this.shown) return
    const { body } = this
    const { tube, bipod, plate } = mortarShape
    const ground = { x: body.x, y: body.ground }
    if (body.dead)
      // the tube lies on the ground, its foot by the plate
      this.drawPart(ctx, this.image, tube.foot, { x: body.x, y: body.ground + (tube.image.height - tube.foot.y) * mortarShape.pixel })
    else {
      const top = body.bipodTop
      this.drawPart(ctx, this.bipod.image, bipod.feet, { x: top.x, y: body.ground })
      this.drawPart(ctx, this.image, tube.foot, body, body.elevation)
    }
    this.drawPart(ctx, this.plate.image, plate.bottom, ground)
    if (this.burning) this.flame.render(this.smoky)
  }
}
