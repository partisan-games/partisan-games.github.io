import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { bodyImage, wreckFor } from '/core/actor/wreckView.js'
import { assets } from '/config.js'
import gunnerArt from '/core/actor/soldiers/machineGunnerArt.js'
import HitReaction from '../HitReaction.js'
import atlasFrame from '../atlasFrame.js'
import { actorArt } from '../reinforcementArt.js'
import { houseBunkerPicture } from '/core/objects/Bunker.js'

/** How long the house's gunner lies, gun and all, in metres, as Do Trsta draws him. */
export const gunnerLength = 2.079

/** The picture of each kind of bunker. */
export const bunkerPictures = { pillbox: 'buildings/bunker-02.png', house: houseBunkerPicture }

/**
 * The machine gunner who lies in the window of a manned bunker, behind his gun: he turns it where the bunker aims, works
 * it on each shot and falls with the bunker. `scale` sizes him to the bunker's picture.
 */
class WindowGunner {
  constructor(scale, owner) {
    this.scale = scale
    this.image = new Image()
    this.image.src = assets.images + gunnerArt.src
    this.sinceShot = Infinity
    this.sinceDeath = 0
    this.hitReaction = new HitReaction(owner, actorArt['machine-gunner-hit'])
  }

  update(dt, { fired, dead }) {
    this.sinceShot = fired ? 0 : this.sinceShot + dt
    this.sinceDeath = dead ? this.sinceDeath + dt : 0
  }

  /** Where he lies, his bottom right, for his level gun to end at `muzzle`, the bunker facing `way` on the screen. */
  pivot(muzzle, way) {
    const { width, height, muzzle: tip } = gunnerArt
    return { x: muzzle.x - way * (width - tip.x) * this.scale, y: muzzle.y + (height - tip.y) * this.scale }
  }

  /** Lies at `pivot`; his gun points along `angle` on the screen. */
  render(ctx, { x, y }, angle, dead) {
    if (!this.image.naturalWidth) return
    const { width, height, gutter, fireDuration, fireFrames, deathDuration } = gunnerArt
    const firing = !dead && this.sinceShot < fireDuration
    const frame = dead ? Math.min(3, Math.floor(this.sinceDeath / deathDuration * 4))
      : firing ? Math.min(fireFrames - 1, Math.floor(this.sinceShot / fireDuration * fireFrames)) : 0
    ctx.save()
    ctx.translate(x, y)
    // the picture points the gun left, about its bottom right
    ctx.rotate(angle + Math.PI)
    ctx.imageSmoothingEnabled = false
    if (!this.hitReaction.draw(ctx, { width: width * this.scale, height: height * this.scale,
      left: -width * this.scale, top: -height * this.scale }))
      ctx.drawImage(this.image, ...atlasFrame(width, height, frame, dead ? 2 : firing ? 1 : 0, gutter),
        -width * this.scale, -height * this.scale, width * this.scale, height * this.scale)
    ctx.restore()
  }
}

/**
 * How a bunker body looks and sounds in 2D, drawn facing left: its picture, the bursts of its gun and their rounds, its
 * burning wreck, and on the fortified house the machine gunner in its window, his gun's muzzle where the body fires
 * from. It only reads the body.
 */
export default class BunkerSprite extends BodySprite {
  /** `kind` is the name of the body's kind. */
  constructor(body, { kind, projection, camera, z = -1, roundLayer }) {
    super(body, bunkerPictures[kind], { projection, camera, facing: -1, flammable: true, z })
    wreckFor(bunkerPictures[kind])
    this.roundLayer = roundLayer
    // the house shows its damage a little before it starts to smoke (owner, 2026-11-26)
    this.damagedBelow = .7
    this.gunner = kind === 'house' ? new WindowGunner(projection.length(gunnerLength) / gunnerArt.width, this) : null
    if (this.gunner) this.children.push(this.gunner.hitReaction)
    this.gunSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.gunSound)
    this.shotsSeen = body.shotsFired
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    const fired = body.shotsFired > this.shotsSeen
    if (fired) this.gunSound.play()
    this.shotsSeen = body.shotsFired
    this.gunner?.update(dt, { fired, dead: body.dead })
    this.syncViews(body.bullets.projectiles, round => {
      const view = new BulletSprite(round, this.projection, { scale: .4 })
      if (this.roundLayer !== undefined) view.position.z = this.roundLayer
      return view
    })
  }

  render(ctx) {
    if (!this.shown) return
    const image = bodyImage(this)
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.flipY, 1)
    ctx.imageSmoothingEnabled = false
    if (image.naturalWidth) ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
    const muzzle = this.projection.point(this.body.muzzle)
    this.gunner?.render(ctx, this.gunner.pivot(muzzle, this.body.forward), this.projection.angle(0, this.body.aimAngle), this.body.dead)
    if (this.burning) this.flame.render(this.smoky)
  }
}
