import GameObject2D from '/core/actor/GameObject2D.js'
import BodySprite from '/core/actor/BodySprite.js'
import CannonballSprite from '/core/actor/projectiles/CannonballSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { gunShape } from '/core/gameplay/bodies/artillery/FieldGun.js'
import ArtClip from '/core/actor/ArtClip.js'

const wreck = {
  src: 'armies/game-ready/wrecks/field-gun.png', width: 500, height: 260, anchor: { x: 240, y: 164.5 },
  clips: { dead: { ms: [1000] } },
}

/**
 * How a field gun body looks and sounds in 2D: its barrel turned to its elevation, drawn facing right and flipped
 * upside down when it faces left, its carriage under it, the bang of a shot, its fire when it burns, and its shots.
 * It only reads the body.
 */
export default class FieldGunSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/artiljerija/field-gun-barrel-pixel.png', { projection, camera, flammable: true })
    this.carriage = new GameObject2D('armies/game-ready/artiljerija/field-gun-carriage-pixel.png')
    this.carriage.layer = 1
    this.wreckArt = new ArtClip(wreck)
    this.children.push(this.carriage, this.wreckArt)
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.muzzle } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.update(0)
  }

  get muzzle() {
    return this.projection.point(this.body.muzzle)
  }

  /** It burns while badly damaged, once its flame has loaded. */
  get burning() {
    return this.flammable && this.body.burning
  }

  /** The redrawn barrel turns at its measured pivot; the carriage stands behind and below it. */
  fit() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    const { barrel, carriage } = gunShape
    this.width = projection.length(barrel.image.width * gunShape.pixel)
    this.height = this.width * barrel.image.height / barrel.image.width
    this.angle = projection.angle(body.forward > 0 ? 0 : Math.PI, body.elevation)
    this.flipX = body.forward
    this.alive = body.alive
    if (!this.carriage) return
    const place = projection.point(body.carriage)
    this.carriage.setPosition(place.x, place.y)
    this.carriage.width = this.width * carriage.image.width / barrel.image.width
    this.carriage.height = this.carriage.width * carriage.image.height / carriage.image.width
    this.carriage.scaleX = body.forward
    this.carriage.visible = body.alive
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.shotsFired > this.shotsSeen) this.shotSound.play()
    this.shotsSeen = body.shotsFired
    this.syncViews(body.shells.projectiles, ball => new CannonballSprite(ball, this.projection))
  }

  render(ctx) {
    if (!this.shown) return
    const { body, projection } = this
    const scale = projection.length(gunShape.pixel)
    if (body.dead && this.wreckArt.image.naturalWidth) {
      const place = projection.point(body.carriage)
      this.wreckArt.draw(ctx, { name: 'dead', time: 0, x: place.x, y: place.y, scaleX: scale, flip: body.forward })
    } else if (this.image.naturalWidth) {
      ctx.save()
      ctx.translate(this.x, this.y)
      ctx.rotate(this.angle)
      ctx.scale(1, body.forward)
      ctx.imageSmoothingEnabled = false
      const { pivot, image } = gunShape.barrel
      ctx.drawImage(this.image, -pivot.x * scale, -pivot.y * scale, image.width * scale, image.height * scale)
      ctx.restore()
    }
    if (this.burning) this.flame.render(this.smoky)
  }
}
