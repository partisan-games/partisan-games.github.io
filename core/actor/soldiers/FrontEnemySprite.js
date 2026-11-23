import BodySprite from '../BodySprite.js'
import ArtClip from '../ArtClip.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'
import art from './frontEnemyArt.js'
import kinds from '/core/gameplay/frontEnemyKinds.js'

/** Full street-fighting figures shared by Otpisani and its catalogue. */
export default class FrontEnemySprite extends BodySprite {
  constructor(body, { kind = 'rifleman', projection, camera } = {}) {
    const descriptor = art[kind]
    if (!descriptor) throw new RangeError('Unknown frontal enemy: ' + kind)
    super(body, descriptor.src, { projection, camera })
    this.kind = kind
    this.clip = new ArtClip(descriptor)
    this.children.push(this.clip)
    this.flash = new Image()
    this.flash.src = assets.images + 'pucanje.png'
    this.shotSound = new Sound(kinds[kind].sound, { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.hitsSeen = body.hitsTaken
    this.shotTime = this.hitTime = Infinity
    /** Metres walked, so the feet step as far as the body goes instead of sliding at another pace. */
    this.walked = 0
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.state === 'move') this.walked += Math.abs(body.vx) * dt
    const shot = body.alive && body.shotsFired > this.shotsSeen
    if (shot) this.shotSound.play()
    this.shotTime = shot ? 0 : this.shotTime + dt
    this.hitTime = body.dead ? Infinity : body.hitsTaken > this.hitsSeen ? 0 : this.hitTime + dt
    this.shotsSeen = body.shotsFired
    this.hitsSeen = body.hitsTaken
  }

  get animation() {
    if (this.body.dead) return { name: 'dead', time: this.body.stateTime }
    if (this.hitTime < this.clip.seconds('hit')) return { name: 'hit', time: this.hitTime }
    if (this.body.state === 'move') {
      const name = this.body.forward < 0 ? 'walk-left' : 'walk-right'
      return { name, time: this.walked / kinds[this.kind].stride * this.clip.seconds(name) }
    }
    return { name: this.body.state === 'attack' ? 'attack' : 'idle', time: this.body.stateTime }
  }

  render(ctx) {
    if (!this.shown) return
    const { name, time } = this.animation
    const { anchor, muzzle, standingPixels } = this.clip.art
    const scale = this.height / standingPixels
    const { x } = this, y = this.y + this.height / 2
    const drawn = this.clip.draw(ctx, { name, time, x, y, scaleX: scale })
    if (!drawn || name !== 'attack' || this.shotTime >= .06 || !this.flash.naturalWidth) return
    const effectScale = this.height / (this.clip.art.effectStandingPixels ?? standingPixels)
    const width = this.flash.naturalWidth * effectScale * .65
    const height = this.flash.naturalHeight * effectScale * .65
    ctx.drawImage(this.flash, x + (muzzle[0] - anchor.x) * scale - width / 2,
      y + (muzzle[1] - anchor.y) * scale - height / 2, width, height)
  }
}
