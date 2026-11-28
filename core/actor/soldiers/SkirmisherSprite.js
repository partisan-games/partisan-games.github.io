import StandingSprite from '/core/actor/StandingSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ustanakArt, { italianRiflemanHit } from '/core/actor/ustanakArt.js'
import ArtClip from '/core/actor/ArtClip.js'
import { partisanMovement } from '/core/actor/actionArt.js'
import spriteArt from '/core/actor/spriteArt.js'

const flash = spriteArt['muzzle-flash']
const flashArt = { src: flash.src, ...flash.frame, anchor: flash.anchor,
  clips: { fire: { ms: [26, 26, 24, 24] } } }

/** How a skirmisher looks and sounds: kneeling with his rifle, and each shot played once with its bang. */
export default class SkirmisherSprite extends StandingSprite {
  constructor(body, { projection, camera, italian = false }) {
    super(body, italian ? ustanakArt.italianRifleman : ustanakArt.rifleman,
      { projection, camera, hitArt: italian ? italianRiflemanHit : undefined })
    this.shotSound = new Sound('rifle.mp3', { volume: .25, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.sinceShot = Infinity
    if (italian) {
      this.flashArt = new ArtClip(flashArt)
      this.children.push(this.flashArt)
    } else {
      this.movementArt = new ArtClip(partisanMovement)
      this.children.push(this.movementArt)
    }
    this.walked = 0
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.state === 'move') this.walked += Math.abs(body.vx) * dt
    this.sinceShot += dt
    if (body.shotsFired > this.shotsSeen) {
      this.sinceShot = 0
      this.shotSound.play()
    }
    this.shotsSeen = body.shotsFired
    const firing = !body.dead && this.sinceShot < this.art.durations.fire
    this.clip = body.dead && !this.movementArt ? 'dead' : firing ? 'fire' : 'idle'
    this.clipTime = firing ? this.sinceShot : body.stateTime
    this.loop = this.clip === 'idle'
  }

  render(ctx) {
    if (!this.shown) return
    if (this.renderHit(ctx)) return
    if (this.flashArt) {
      super.render(ctx)
      if (this.clip === 'fire' && this.sinceShot < this.flashArt.seconds('fire')) {
        const { width, height, muzzle, baseline } = this.art
        this.flashArt.draw(ctx, { name: 'fire', time: this.sinceShot, flip: this.flipY,
          x: this.x + this.flipY * (muzzle.x / width - .5) * this.width,
          y: this.y + (.5 - baseline + muzzle.y / height) * this.height,
          scaleX: .45 * this.width / 88 })
      }
      return
    }
    const { body } = this
    let name, time = body.stateTime, reverse = false
    if (body.dead) name = body.fellStanding ? 'deathStanding' : 'death'
    else if (body.state === 'standUp') name = 'standUp'
    else if (body.state === 'kneel') {
      name = 'standUp'
      reverse = true
    } else if (body.state === 'move') {
      name = 'walk'
      time = this.walked
    }
    if (name && this.movementArt.draw(ctx, {
      name, time, reverse, x: this.x, y: this.y + this.height / 2,
      scaleX: this.width / 128, scaleY: this.height / 128, flip: this.flipY,
    })) return
    super.render(ctx)
  }
}
