import BodySprite from '/core/actor/BodySprite.js'
import BombSprite from '/core/actor/projectiles/BombSprite.js'
import Explosion from '/core/actor/effects/Explosion.js'
import AircraftPropellers from './AircraftPropellers.js'

const src = 'game-ready/avioni/ju87.png'
/** A crash burst is drawn this far above the ground, in pixels, so the fire stands on it. */
const burstLift = 64

/**
 * How a Ju 87 body looks in 2D: the plane, nose to the left, with its turning propeller, its bomb, its fire once shot
 * down, and the burst where its wreck crashes, after which it is gone. It only reads the body.
 */
export default class DiveBomberSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, src, { projection, camera, facing: -1, flammable: true })
    this.propellers = new AircraftPropellers(src)
    this.burst = new Explosion(camera)
    this.bomb = new BombSprite(body.bomb, { projection, camera })
    this.children.push(this.bomb, this.burst)
    this.crashSeen = body.crashed
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.propellers.update(dt, body.alive)
    if (body.crashed && !this.crashSeen) this.burst.start(this.x, this.y - burstLift)
    this.crashSeen = body.crashed
    this.visible = !body.crashed
  }

  drawOver(ctx) {
    this.propellers.renderLocal(ctx, this)
  }
}
