import GameObject2D from '/core/actor/GameObject2D.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'

/** The grenade in the grenadier's hand in the atlas of his throw, which flies alone once thrown, in pixels of it. */
const picture = { src: 'game-ready/vojnici/bombas-throw-right-sprites.png', x: 213, y: 0, width: 9, height: 9 }
/** How fast it tumbles in flight, in turns a second. */
const tumble = 2

/**
 * How a hand grenade looks and sounds, seen from above as the grenadier stands: tumbling through the air above the
 * ground it flies over, then its burst and bang where it lands. It only reads the body.
 */
export default class GrenadeSprite extends GameObject2D {
  constructor(grenade, { projection, camera = null }) {
    super(picture.src, { visible: false, z: -2 })
    Object.assign(this, { grenade, projection })
    this.burst = new Explosion(camera, { scale: .6 })
    this.children.push(this.burst)
    this.burstSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
    this.burstsSeen = grenade.bursts
    this.turn = 0
  }

  /** It flies past the edges of the view until it lands, so it is never left out for being off screen. */
  get offScreen() {
    return false
  }

  update(dt) {
    const { grenade, projection } = this
    const ground = projection.point(grenade)
    // the higher it flies, the higher above its ground it is drawn
    this.setPosition(ground.x, ground.y - projection.length(grenade.y))
    this.visible = grenade.state === 'flight'
    this.turn = this.visible ? this.turn + tumble * dt : 0
    if (grenade.bursts > this.burstsSeen) {
      // the burst rises from the ground where it landed
      this.burst.start(ground.x, ground.y - this.burst.reach)
      this.burstSound.play()
    }
    this.burstsSeen = grenade.bursts
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.turn * Math.PI * 2)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, picture.x, picture.y, picture.width, picture.height,
      -picture.width / 2, -picture.height / 2, picture.width, picture.height)
    ctx.restore()
  }
}
