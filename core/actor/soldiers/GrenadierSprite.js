import BodySprite from '/core/actor/BodySprite.js'
import FallingBlood from '/core/actor/effects/FallingBlood.js'
import GrenadeSprite from '/core/actor/projectiles/GrenadeSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'

/** The atlas: its rows, with their frames and seconds; how long it keeps walking after a stop, and its stride. */
const clips = { idle: { row: 0, frames: 2, seconds: .6 }, walk: { row: 1, frames: 8, seconds: .8 }, death: { row: 2, frames: 6, seconds: .6 } }
const columns = 8
/** The throw, drawn to the right from his standing pose, in its own atlas of eight frames, and the seconds of each. */
const throwArt = { src: 'armies/game-ready/vojnici/bombas-throw-right-sprites.png', frames: [.1, .1, .1, .1, .08, .1, .1, .12] }

/** The frame of the throw `seconds` into it; the last one holds. */
function throwFrame(seconds) {
  let end = 0
  for (const [frame, length] of throwArt.frames.entries()) {
    end += length
    if (seconds < end) return frame
  }
  return throwArt.frames.length - 1
}
const slowDown = .15
/** Pixels between two footsteps, and the speed in metres a second at which the walk plays at its own pace. */
const step = { every: 35, pace: 4 }

/**
 * How a grenadier looks and sounds from above: standing, walking at the pace he moves, his footsteps, throwing his
 * grenade the way he faces and the grenade itself, the blood and the thud of a hit, and his fall. It only reads the
 * body.
 */
export default class GrenadierSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/vojnici/bombas-sprites.png', { projection, camera, z: -1 })
    this.stepSound = new Sound('footstep-gravel-01.mp3', { variants: ['footstep-gravel-02.mp3', 'footstep-gravel-03.mp3', 'footstep-gravel-04.mp3'],
      profile: 'footstep', spatial: { getPosition: () => this.position } })
    this.hitSound = new Sound('body-impact-01.mp3', { profile: 'impact', spatial: { getPosition: () => this.position } })
    this.throwSound = new Sound('grenade-throw.mp3', { volume: .65, profile: 'footstep', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.stepSound, this.hitSound, this.throwSound)
    this.throwsSeen = body.shotsFired
    this.blood = new FallingBlood({ fallTime: clips.death.seconds })
    this.throwImage = new Image()
    this.throwImage.src = assets.images + throwArt.src
    this.children.push(this.blood, new GrenadeSprite(body.grenade, { projection, camera }))
    this.clip = 'idle'
    this.clipTime = 0
    this.stops = 0
    this.walked = 0
    this.seenAlive = body.alive
  }

  /** It stands upright on the screen, as seen from above, whatever way it heads. */
  fit() {
    super.fit()
    this.height = this.projection.length(this.body.size.width)
    this.angle = 0
    this.flipY = 1
  }

  update(dt) {
    const before = { x: this.x, y: this.y }
    super.update(dt)
    const { body } = this
    if (body.shotsFired > this.throwsSeen) this.throwSound.play()
    this.throwsSeen = body.shotsFired
    if (this.seenAlive && body.dead) {
      this.hitSound.play()
      this.blood.start({ x: this.x + 5, y: this.y - 10, groundY: this.y + this.height / 2,
        groundX: this.x + body.facing * this.width * .2,
        width: this.width, height: this.height })
      this.clip = 'death'
      this.clipTime = 0
    }
    this.seenAlive = body.alive
    if (body.dead) {
      // a large step must still reach and hold the fallen pose
      this.clipTime = Math.min(this.clipTime + dt, clips.death.seconds)
      return
    }
    if (dt > 0) {
      this.walked += Math.hypot(this.x - before.x, this.y - before.y)
      if (this.walked >= step.every) {
        this.walked %= step.every
        this.stepSound.play()
      }
    }
    if (body.throwing) {
      this.clip = 'throw'
      return
    }
    const moving = body.speed > .125
    this.stops = moving ? slowDown : Math.max(0, this.stops - dt)
    const walking = moving || this.stops > 0
    const clip = walking ? 'walk' : 'idle'
    if (clip !== this.clip) this.clipTime = 0
    this.clip = clip
    const pace = walking ? body.speed / step.pace * (moving ? 1 : this.stops / slowDown) : 1
    this.clipTime += dt * pace
  }

  /** The frame of `clip` it shows now, in its atlas: the image and the source rectangle. */
  get frame() {
    if (this.clip === 'throw') {
      const image = this.throwImage, width = image.naturalWidth / throwArt.frames.length
      return { image, x: throwFrame(this.body.stateTime) * width, y: 0, width, height: image.naturalHeight }
    }
    const clip = clips[this.clip]
    const width = this.image.naturalWidth / columns, height = this.image.naturalHeight / 3
    const time = this.clip === 'death' ? this.clipTime : this.clipTime % clip.seconds
    const frame = Math.min(clip.frames - 1, Math.floor(time / clip.seconds * clip.frames))
    return { image: this.image, x: frame * width, y: clip.row * height, width, height }
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    if (this.renderHit(ctx, { flip: this.body.facing })) return
    const { image, x, y, width, height } = this.frame
    if (!image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    // drawn facing right, he is mirrored whole to face left, the way he walks and throws
    ctx.scale(this.body.facing, 1)
    ctx.drawImage(image, x, y, width, height, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
