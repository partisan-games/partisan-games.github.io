import BodySprite from '/core/actor/BodySprite.js'
import BombSprite from '/core/actor/projectiles/BombSprite.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'

/** A crash burst is drawn this far above the ground, in pixels, so the fire stands on it. */
const burstLift = 64

/**
 * The source drawings of planes shown whole, until their own art comes, and the way each nose points: -1 to the
 * left, 1 to the right.
 */
export const aircraftPictures = {
  he111: { src: 'armies/nemci/avioni/heinkel-he-111-h2.png', facing: -1 },
  storch: { src: 'armies/nemci/avioni/fieseler-fi-156-storch-01.png', facing: 1 },
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
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.engineSound.setPlaying(body.alive)
    if (body.crashed && !this.crashSeen) this.burst.start(this.x, this.y - burstLift)
    this.crashSeen = body.crashed
    this.visible = !body.crashed
  }
}
