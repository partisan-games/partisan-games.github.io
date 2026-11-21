import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'
import ShoreDestruction from './ShoreDestruction.js'
import { nest } from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'

/** How far the gun is drawn from its mount to its muzzle, in pixels, before it is scaled to its length. */
const gunDrawn = 14
/** How far from the nest's middle each gunner lies, as a share of its length. */
const crewApart = .23

/**
 * How a machine-gun nest on a river bank looks and sounds from above: the nest, its gun turned to its aim and its crew
 * of two, the shots and their rounds; once destroyed, a burst, its fire and its fallen crew. It only reads the body.
 */
export default class ShoreMachineGunSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg', { projection, camera })
    this.crew = new Image()
    this.crew.src = `${assets.images}armies/nemci-patrola.gif`
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

  /** Two gunners lie by the gun; destroyed, they fall apart from their dropped rifles. */
  renderCrew(ctx) {
    if (!this.crew.naturalWidth) return
    const { body } = this
    const fallen = body.dead ? Math.min(1, body.stateTime / .35) : 0
    for (const side of [-1, 1]) {
      const offset = side * crewApart * this.width
      ctx.save()
      ctx.translate(this.x + Math.cos(this.angle) * (offset + side * fallen * 5),
        this.y + Math.sin(this.angle) * offset + body.side * fallen * 3)
      ctx.rotate(this.gunAngle + Math.PI * .75 + (side < 0 ? 0 : .15) + side * fallen * 1.2)
      if (body.dead) {
        ctx.filter = 'brightness(.65) saturate(.4)'
        ctx.scale(1 + fallen * .15, 1 - fallen * .2)
        ctx.drawImage(this.crew, 8, 14, 24, 22, -9, -8, 18, 16.5)
        ctx.filter = 'none'
        ctx.translate(side * 11, 4)
        ctx.rotate(side * .8)
        ctx.fillStyle = '#51432e'
        ctx.fillRect(-1, -4, 2, 8)
        ctx.fillStyle = '#242b29'
        ctx.fillRect(-.5, -11, 1, 9)
      } else ctx.drawImage(this.crew, 0, 0, 32, 36, -12, -13.5, 24, 27)
      ctx.restore()
    }
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
    this.renderCrew(ctx)
    const { mount } = this
    ctx.save()
    ctx.translate(mount.x, mount.y)
    ctx.rotate(this.gunAngle + (this.body.dead ? .9 : 0))
    const scale = this.projection.length(nest.gun) / gunDrawn
    ctx.scale(scale, scale)
    ctx.fillStyle = '#374538'
    ctx.fillRect(-4, -2, 9, 4)
    ctx.fillStyle = '#1e2c25'
    ctx.fillRect(3, -.8, 11, 1.6)
    ctx.strokeStyle = '#687563'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(12, -3)
    ctx.moveTo(10, 0)
    ctx.lineTo(12, 3)
    ctx.stroke()
    ctx.restore()
  }
}
