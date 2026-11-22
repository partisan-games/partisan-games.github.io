import BodySprite from '/core/actor/BodySprite.js'
import BombSprite from '/core/actor/projectiles/BombSprite.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'
import ActorAtlas from '../ActorAtlas.js'
import { actorArt } from '../reinforcementArt.js'
import DamageSmoke from '../effects/DamageSmoke.js'

/** A crash burst is drawn this far above the ground, in pixels, so the fire stands on it. */
const burstLift = 64

/**
 * The prepared plane atlases and the way each nose points: -1 to the
 * left, 1 to the right.
 */
export const aircraftPictures = {
  he111: actorArt.he111,
  storch: actorArt.storch,
}

/**
 * How a plane drawn as one `picture` looks and sounds in 2D: the plane and its engine, its bombs if it carries any,
 * its fire once shot down, and the burst where its wreck crashes, after which it is gone. It only reads the body.
 */
export default class PictureAircraftSprite extends BodySprite {
  constructor(body, { picture, projection, camera }) {
    super(body, picture.src, { projection, camera, facing: picture.facing, flammable: true })
    this.burst = new Explosion(camera)
    this.children.push(this.burst, ...(body.bombs ?? []).map(round => new BombSprite(round, { projection, camera })))
    this.engineSound = new Sound('engine-aircraft.mp3', { loop: true, profile: 'engine', volume: .2, spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound)
    this.crashSeen = body.crashed
    this.sheet = new ActorAtlas(picture)
    this.children.push(this.sheet)
    this.children.push(new DamageSmoke(this))
    this.elapsed = 0
  }

  update(dt) {
    super.update(dt)
    this.elapsed += dt
    const { body } = this
    this.engineSound.setPlaying(body.alive)
    if (body.crashed && !this.crashSeen) this.burst.start(this.x, this.y - burstLift)
    this.crashSeen = body.crashed
    this.visible = !body.crashed
  }

  render(ctx) {
    if (!this.shown) return
    const damaged = this.body.health.current < this.body.health.maximum / 2
    const clip = this.body.dead ? 'dead' : damaged ? 'damaged' : this.body.state === 'attack' && this.sheet.art.clips.attack ? 'attack' : 'idle'
    const time = clip === 'attack' ? .79 : this.elapsed
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, this.flipX)
    this.sheet.drawLocal(ctx, this, clip, time, { elapsed: this.elapsed })
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
