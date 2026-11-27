import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ActorAtlas from '../ActorAtlas.js'
import { actorArt } from '../reinforcementArt.js'
import MuzzleFlash from '../effects/MuzzleFlash.js'
import DamageSmoke from '../effects/DamageSmoke.js'

/**
 * The prepared atlas of each kind, the way its front points (1 right, -1 left), and the
 * sound of its engine.
 */
export const gunCarrierPictures = {
  motorcycle: { ...actorArt.motorcycle, engine: 'engine-6000.mp3' },
  halftrack: { ...actorArt.sdkfz251, engine: 'engine-diesel.mp3' },
  armoredCar: { ...actorArt.sdkfz222, engine: 'engine-diesel.mp3' },
}

/**
 * How a machine-gun carrier drawn as its `picture` looks and sounds in 2D: the vehicle with its crew, its engine, the
 * bursts of its gun and their rounds, and its fire once wrecked. It only reads the body.
 */
export default class GunCarrierSprite extends BodySprite {
  constructor(body, { picture, projection, camera, z }) {
    super(body, picture.src, { projection, camera, facing: picture.facing, flammable: true, z })
    this.engineSound = new Sound(picture.engine, { steady: true, loop: true, volume: .5, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.gunSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.gunSound)
    this.shotsSeen = body.shotsFired
    this.sheet = new ActorAtlas(picture)
    this.flash = new MuzzleFlash(camera ?? { cameraX: 0, cameraY: 0 })
    this.children.push(this.sheet, this.flash)
    this.children.push(new DamageSmoke(this))
    this.elapsed = 0
    this.sinceShot = Infinity
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.elapsed += dt
    this.sinceShot = body.shotsFired > this.shotsSeen ? 0 : this.sinceShot + dt
    if (body.shotsFired > this.shotsSeen) this.flash.start(this.projection.point(body.muzzle),
      this.projection.angle(body.yaw, body.aimPoint ? Math.atan2(body.aimPoint.y - body.muzzle.y, Math.abs(body.aimPoint.x - body.muzzle.x)) : 0))
    if (body.dead) this.flash.hide()
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > this.shotsSeen && body.burstFired === 1) this.gunSound.play()
    this.shotsSeen = body.shotsFired
    this.syncViews(body.bullets.projectiles, round => new BulletSprite(round, this.projection, { scale: .4 }))
  }

  render(ctx) {
    if (!this.shown) return
    const moving = Math.abs(this.body.vx) > .025
    const damaged = this.body.health.current < this.body.health.maximum / 2
    const clip = this.body.dead ? 'dead' : damaged ? 'damaged' : this.sinceShot < .4 ? 'attack' : moving ? 'drive' : 'idle'
    const time = this.body.state === 'wreck' ? this.sheet.seconds('dead')
      : clip === 'attack' ? this.sinceShot : moving || clip === 'idle' ? this.elapsed : 0
    const gunAngle = -this.body.gunPitch * this.facing
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, 1)
    this.sheet.drawLocal(ctx, this, clip, time,
      { elapsed: this.elapsed, gunTime: this.sinceShot < .4 ? this.sinceShot : 0, gunAngle })
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
