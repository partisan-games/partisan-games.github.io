import AtlasSprite from '/core/actor/AtlasSprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ArtClip from '/core/actor/ArtClip.js'
import { riflemanReload } from '/core/actor/actionArt.js'

/** The clip of each state; firing has its own clips, level and raised. */
const clips = { idle: 'rest', move: 'walk', dead: 'death' }

/**
 * How a soldier body looks and sounds in 2D, from its atlas `art`, drawn facing right: at ease, walking, firing level
 * or with the rifle raised, each shot played once and then held at aim, and falling. It only reads the body.
 */
export default class RiflemanSprite extends AtlasSprite {
  constructor(body, { art, projection, camera }) {
    super(body, art, { projection, camera })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    /** Seconds since the last shot; before the first, the rifle is held at aim. */
    this.sinceShot = Infinity
    if (body.kind.reloadTime) {
      this.reloadArt = new ArtClip(riflemanReload)
      this.children.push(this.reloadArt)
    }
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.sinceShot += dt
    if (body.shotsFired > this.shotsSeen) {
      this.sinceShot = 0
      this.shotSound.play()
    }
    this.shotsSeen = body.shotsFired
    if (body.state === 'attack') {
      this.clip = body.raised ? 'fireUp' : 'fire'
      this.clipTime = this.sinceShot
    } else if (body.state === 'reload') {
      this.clip = 'fire'
      this.clipTime = 0
    } else {
      this.clip = clips[body.state]
      this.clipTime = body.stateTime
    }
    this.syncViews(body.bullets.projectiles, bullet => new BulletSprite(bullet, this.projection))
  }

  render(ctx) {
    if (!this.shown) return
    if (this.renderHit(ctx)) return
    const { body, art, artScale: scale } = this
    const sinceFire = this.sinceShot - art.clips.fire.seconds
    const automatic = body.state === 'attack' && !body.raised && sinceFire >= 0 && sinceFire < body.kind.reloadTime
    if (!body.dead && this.reloadArt && (body.state === 'reload' || automatic)) {
      const [left, , right] = art.body
      if (this.reloadArt.draw(ctx, {
        name: 'reload', time: body.state === 'reload' ? body.stateTime : sinceFire,
        x: this.x + this.flipY * (art.anchor.x - (left + right) / 2) * scale,
        y: this.y + this.height / 2, scaleX: scale, flip: this.flipY,
      })) return
    }
    super.render(ctx)
  }
}
