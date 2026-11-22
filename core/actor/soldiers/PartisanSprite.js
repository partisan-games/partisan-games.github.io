import BodySprite from '../BodySprite.js'
import ArtClip from '../ArtClip.js'
import { actorArt } from '../reinforcementArt.js'
import BulletSprite from '../projectiles/BulletSprite.js'
import MuzzleFlash from '../effects/MuzzleFlash.js'
import Sound from '/core/io/audio/SoundSource.js'

const artIds = { runner: 'partisan-runner', lmg: 'partisan-lmg', rear: 'partisan-rear', loader: 'partisan-loader' }

/** The same prepared partisan, action events and sound in its story and every battlefield. */
export default class PartisanSprite extends BodySprite {
  constructor(body, options) {
    const art = actorArt[artIds[body.role]]
    super(body, art.src, options)
    this.sheet = new ArtClip(art)
    this.flash = new MuzzleFlash(options.camera ?? { cameraX: 0, cameraY: 0 })
    this.children.push(this.sheet, this.flash)
    this.shotSound = new Sound(body.role === 'lmg' ? 'rafal.mp3' : 'rifle.mp3',
      { profile: 'rifle', volume: .25, spatial: { getPosition: () => this.position } })
    this.stepSound = new Sound('footstep-gravel-01.mp3', { profile: 'footstep', volume: .2, spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.stepSound)
    this.seen = { shots: body.shotsFired, hits: body.hitsTaken }
    this.sinceHit = Infinity
    this.elapsed = 0
    this.walked = 0
  }

  update(dt) {
    super.update(dt)
    this.elapsed += dt
    const { body, seen } = this
    this.sinceHit = body.hitsTaken > seen.hits ? 0 : this.sinceHit + dt
    if (body.shotsFired > seen.shots) {
      this.shotSound.play()
      this.flash.start(this.projection.point(body.muzzle), this.projection.angle(body.yaw))
    }
    this.walked += Math.abs(body.vx) * dt
    if (body.alive && this.walked >= .8) {
      this.walked %= .8
      this.stepSound.play()
    }
    if (body.dead) this.flash.hide()
    Object.assign(seen, { shots: body.shotsFired, hits: body.hitsTaken })
    this.syncViews(body.bullets.projectiles, bullet => new BulletSprite(bullet, this.projection))
  }

  render(ctx) {
    if (!this.shown) return
    const { body } = this
    const name = body.dead ? 'dead' : this.sinceHit < .32 ? 'hit' : body.state === 'work' ? 'work'
      : body.sinceShot < .4 && body.kind.armed ? 'attack' : Math.abs(body.vx) > .025 ? 'run' : 'idle'
    const time = name === 'hit' ? this.sinceHit : name === 'attack' ? body.sinceShot : name === 'dead' ? body.stateTime : this.elapsed
    // A man's standing height sets the scale; weapons and the fallen pose may extend past his hit box.
    const [, top, , bottom] = this.sheet.art.bounds
    const scale = this.projection.length(body.size.height) / (bottom - top)
    const [left, , right] = this.sheet.art.bounds
    ctx.save()
    ctx.translate(this.x, this.y + this.height / 2)
    ctx.scale(this.flipY, 1)
    const { row, frame } = this.sheet.sample(name, time)
    if (this.sheet.image.naturalWidth) ctx.drawImage(this.sheet.image,
      frame * this.sheet.art.width, row * this.sheet.art.height, this.sheet.art.width, this.sheet.art.height,
      -(left + right) / 2 * scale, -bottom * scale, this.sheet.art.width * scale, this.sheet.art.height * scale)
    ctx.restore()
  }
}
