import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import art from './machineGunnerArt.js'

/**
 * How a machine gunner looks and sounds from above: lying behind his gun, which he turns where he aims about its
 * pivot, working it on each shot, and falling dead. His picture points the gun left from its bottom right, the pivot.
 * It only reads the body.
 */
export default class MachineGunnerSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, art.src, { projection, camera, z: -1 })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.sinceShot = art.fireDuration
    this.shotsSeen = body.shotsFired
  }

  fit() {
    super.fit()
    this.height = this.projection.length(this.body.size.width)
    this.angle = this.projection.angle(this.body.yaw) + Math.PI
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.sinceShot = Math.min(art.fireDuration, this.sinceShot + dt)
    if (body.shotsFired > this.shotsSeen) {
      this.sinceShot = 0
      this.shotSound.play()
    }
    this.shotsSeen = body.shotsFired
    this.syncViews(body.bullets.projectiles, round => new BulletSprite(round, this.projection, { scale: .4 }))
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    if (this.renderHit(ctx, { flip: 1, left: -this.width, top: -this.height })) return
    const { body } = this
    const firing = body.alive && this.sinceShot < art.fireDuration
    const frame = body.dead ? Math.min(3, Math.floor(body.stateTime / art.deathDuration * 4))
      : firing ? Math.min(art.fireFrames - 1, Math.floor(this.sinceShot / art.fireDuration * art.fireFrames)) : 0
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, frame * art.width, body.dead ? art.height * 2 : firing ? art.height : 0,
      art.width, art.height, -this.width, -this.height, this.width, this.height)
    ctx.restore()
  }
}
