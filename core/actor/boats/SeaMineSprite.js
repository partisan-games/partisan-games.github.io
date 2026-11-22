import BodySprite from '../BodySprite.js'
import ArtClip from '../ArtClip.js'
import { actorArt } from '../reinforcementArt.js'
import Explosion from '../effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'

/** Its gentle floating loop and single explosion share the world's simulation time. */
export default class SeaMineSprite extends BodySprite {
  constructor(body, options) {
    super(body, actorArt['sea-mine'].src, options)
    this.sheet = new ArtClip(actorArt['sea-mine'])
    this.burst = new Explosion(options.camera)
    this.children.push(this.sheet, this.burst)
    this.sound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.sound)
    this.seenAlive = body.alive
    this.elapsed = 0
  }

  update(dt) {
    super.update(dt)
    this.elapsed += dt
    if (this.seenAlive && this.body.dead) {
      this.burst.start(this.x, this.y)
      this.sound.play()
    }
    this.seenAlive = this.body.alive
  }

  render(ctx) {
    if (!this.shown || this.body.dead) return
    const { art } = this.sheet
    const scale = this.width / (art.bounds[2] - art.bounds[0])
    this.sheet.draw(ctx, { name: 'float', time: this.elapsed, x: this.x, y: this.y, scaleX: scale })
  }
}
