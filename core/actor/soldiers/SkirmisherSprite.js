import StandingSprite from '/core/actor/StandingSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ustanakArt from '/core/actor/ustanakArt.js'
import ArtClip from '/core/actor/ArtClip.js'
import { partisanMovement } from '/core/actor/actionArt.js'

const art = ustanakArt.rifleman

/** How a skirmisher looks and sounds: standing with his rifle, and each shot played once with its bang. */
export default class SkirmisherSprite extends StandingSprite {
  constructor(body, { projection, camera }) {
    super(body, art, { projection, camera })
    this.shotSound = new Sound('rifle.mp3', { volume: .25, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.sinceShot = Infinity
    this.movementArt = new ArtClip(partisanMovement)
    this.children.push(this.movementArt)
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
    const firing = this.sinceShot < art.durations.fire
    this.clip = firing ? 'fire' : 'idle'
    this.clipTime = firing ? this.sinceShot : body.stateTime
    this.loop = !firing
  }

  render(ctx) {
    if (!this.shown) return
    if (this.renderHit(ctx)) return
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
