import BodySprite from '/core/actor/BodySprite.js'
import WorldPart from '/core/actor/WorldPart.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * The fighter is drawn as a plane, nose to the left, and its two blades, which spin by squeezing towards the hub and
 * back. Measured on the 404 × 132 px picture: the hub's offset from the picture's middle. `spin` is in turns a
 * second, as seen; once the engine is dead the blades slow down each second by `stall` of their turning and windmill
 * on at `windmill`.
 */
const picture = { width: 404 }
const propeller = { hub: { x: -182, y: -1 }, spin: 5, stall: 1.5, windmill: .7 }
/** A crash burst is drawn this far above the ground, in pixels, so the fire stands on it. */
const burstLift = 64

/**
 * How a Bf 109 body looks and sounds in 2D: the plane with its spinning propeller, the bang of its guns and its
 * bullets, its fire once shot down, and the burst where its wreck crashes, after which it is gone. It only reads the
 * body.
 */
export default class FighterSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/avioni/bf109-telo.png', { projection, camera, facing: -1, flammable: true })
    this.propeller = new WorldPart('armies/game-ready/avioni/bf109-propeler.png', { camera })
    this.burst = new Explosion(camera)
    this.children.push(this.propeller, this.burst)
    this.gunSound = new Sound('aircraft-gun.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.gunSound)
    this.shotsSeen = body.shotsFired
    this.crashSeen = body.crashed
    this.propellerTurn = 0
    this.propellerSpin = propeller.spin
  }

  /**
   * The blades turn fast while the engine runs and only windmill once it is dead. The hub is mirrored and turned with
   * the plane, as the renderer turns the picture before mirroring it.
   */
  spinPropeller(dt) {
    const { propeller: part } = this
    if (this.body.dead)
      this.propellerSpin = Math.max(propeller.windmill, this.propellerSpin * Math.exp(-propeller.stall * dt))
    this.propellerTurn = (this.propellerTurn + this.propellerSpin * dt) % 1
    const scale = this.width / picture.width
    part.width = part.image.naturalWidth * scale
    part.height = part.image.naturalHeight * scale
    part.scaleY = Math.cos(this.propellerTurn * 2 * Math.PI)
    const hubX = propeller.hub.x * scale * this.flipY
    const hubY = propeller.hub.y * scale
    const cos = Math.cos(this.angle), sin = Math.sin(this.angle)
    part.setPosition(this.x + hubX * cos - hubY * sin, this.y + hubX * sin + hubY * cos)
    part.angle = this.angle
    part.flipY = this.flipY
    part.visible = this.visible
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.shotsFired > this.shotsSeen) this.gunSound.play()
    this.shotsSeen = body.shotsFired
    if (body.crashed && !this.crashSeen) this.burst.start(this.x, this.y - burstLift)
    this.crashSeen = body.crashed
    this.visible = !body.crashed
    this.spinPropeller(dt)
    this.syncViews(body.bullets.projectiles, bullet => new BulletSprite(bullet, this.projection))
  }
}
