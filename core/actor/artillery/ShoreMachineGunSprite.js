import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ArtClip from '../ArtClip.js'
import art from './shoreNestArt.js'
import ShoreDestruction from './ShoreDestruction.js'
import { nest } from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'
import { bodyImage } from '../wreckView.js'

/** How far the gun is drawn from its mount to its muzzle, in pixels, before it is scaled to its length. */
const gunDrawn = art.gun.muzzle[0] - art.gun.anchor.x
/** How far from the nest's middle each gunner lies, as a share of its length. */
const crewApart = .23

/**
 * How a machine-gun nest on a river bank looks and sounds from above: the nest, its gun turned to its aim and its crew
 * of two, the shots and their rounds; once destroyed, a burst, its fire and its fallen crew. It only reads the body.
 */
export default class ShoreMachineGunSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, art.src, { projection, camera })
    this.crew = new ArtClip(art.crew)
    this.gun = new ArtClip(art.gun)
    this.children.push(this.crew, this.gun)
    this.destruction = new ShoreDestruction()
    this.front = { position: { z: -2 }, render: ctx => this.renderDestruction(ctx) }
    this.children.push(this.front)
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.fireSound = new Sound('fire.mp3', { volume: .4, loop: true, profile: 'fire', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.fireSound, this.explosionSound)
    this.seen = { shots: body.shotsFired, alive: body.alive }
  }

  fit() {
    super.fit()
    this.height = this.projection.length(this.body.size.width)
  }

  /** The screen angle of its gun, and where it stands. */
  get gunAngle() {
    return this.projection.angle(this.body.gunYaw)
  }

  get mount() {
    return this.projection.point(this.body.mount)
  }

  update(dt) {
    super.update(dt)
    const { body, seen } = this
    if (body.shotsFired > seen.shots) this.shotSound.play()
    if (seen.alive && body.dead) {
      this.explosionSound.play()
      this.destruction.clear()
    }
    Object.assign(seen, { shots: body.shotsFired, alive: body.alive })
    this.fireSound.setPlaying(body.dead && this.shown)
    if (body.dead && this.shown) this.destruction.update(dt)
    this.syncViews(body.bullets.projectiles, round => new BulletSprite(round, this.projection, { scale: .4 }))
  }

  renderDestruction(ctx) {
    if (this.body.dead && this.shown) this.destruction.render(ctx, this, this.body.stateTime)
  }

  /** Two dedicated crew figures turn with the gun and settle into their fallen poses. */
  renderCrew(ctx) {
    const { body } = this
    const fallen = body.dead ? Math.min(1, body.stateTime / .35) : 0
    for (const side of [-1, 1]) {
      const offset = side * crewApart * this.width
      ctx.save()
      ctx.translate(this.x + Math.cos(this.angle) * (offset + side * fallen * 5),
        this.y + Math.sin(this.angle) * offset + body.side * fallen * 3)
      ctx.rotate(this.gunAngle + (side < 0 ? 0 : .15) + side * fallen * 1.2)
      this.crew.draw(ctx, { name: body.dead ? 'dead' : 'idle', time: body.stateTime,
        x: 0, y: 0, scaleX: this.width / 128 * .36 })
      ctx.restore()
    }
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    const damaged = this.body.dead && this.damageArt?.image
    const bags = damaged?.complete && damaged.naturalWidth ? damaged : bodyImage(this)
    ctx.drawImage(bags, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
    this.renderCrew(ctx)
    const { mount } = this
    ctx.save()
    ctx.translate(mount.x, mount.y)
    ctx.rotate(this.gunAngle + (this.body.dead ? .9 : 0))
    const scale = this.projection.length(nest.gun) / gunDrawn
    this.gun.draw(ctx, { name: 'idle', time: 0, x: 0, y: 0, scaleX: scale })
    ctx.restore()
  }
}
