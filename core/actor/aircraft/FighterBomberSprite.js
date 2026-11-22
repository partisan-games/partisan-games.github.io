import TopViewSprite from './TopViewSprite.js'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * How it looks: seconds between solid and faint while it is safe; the propeller seen edge on, in shares of the plane's
 * width and height, and seconds per flicker.
 */
export const look = { blinkTime: .1, propeller: { span: .29, nose: .066, frameTime: .04 } }
/** How the blades flicker as they turn: a share of their span and how solid they are. */
const propellerFrames = [{ span: 1, alpha: .55 }, { span: .82, alpha: .35 }, { span: .92, alpha: .45 }]
/** How much bigger it grows at the top of a loop. */
const loopGrowth = .5

/**
 * How a fighter-bomber looks and sounds from above, in the picture `src`: its turning propeller, its guns and rounds,
 * the bang of a bomb, its blinking while it is safe, a loop that grows it and turns it over on its back, the smoke of
 * a damaged plane, and its fall and fire.
 * It only reads the body.
 */
export default class FighterBomberSprite extends TopViewSprite {
  constructor(body, { src, projection, camera }) {
    super(body, src, { projection, camera })
    this.gunSound = new Sound('aircraft-gun.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.bombSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.gunSound, this.bombSound)
    this.propellerTime = 0
    this.seen = { shots: body.shotsFired, bombs: body.bombsDropped }
  }

  /** A damaged plane smokes and a shot down one burns. */
  get burning() {
    return this.flammable && (this.body.dead || this.body.damaged)
  }

  update(dt) {
    super.update(dt)
    const { body, seen } = this
    this.smoky = body.alive
    this.propellerTime += dt
    if (body.shotsFired > seen.shots) this.gunSound.play()
    if (body.bombsDropped > seen.bombs) this.bombSound.play()
    Object.assign(seen, { shots: body.shotsFired, bombs: body.bombsDropped })
    const progress = body.loopProgress
    this.scaleX = 1 + loopGrowth * Math.sin(Math.PI * progress)
    // 1, 0, -1 on its back, 0 and 1 again
    this.scaleY = this.scaleX * Math.cos(2 * Math.PI * progress)
    this.alpha = body.shield > 0 && Math.floor(body.shield / look.blinkTime) % 2 ? .3 : 1
    this.syncRounds(body.bullets)
  }

  /** The turning blades, seen edge on: a bar at the nose that flickers between a few lengths. */
  drawOver(ctx) {
    if (this.body.dead) return
    const { propeller } = look
    const frame = propellerFrames[Math.floor(this.propellerTime / propeller.frameTime) % propellerFrames.length]
    const half = this.width * propeller.span * frame.span / 2
    const thickness = Math.max(this.height * .008, 1.5)
    ctx.translate(0, this.height * (propeller.nose - .5))
    ctx.globalAlpha *= frame.alpha
    ctx.fillStyle = '#1c1c1a'
    ctx.fillRect(-half, -thickness / 2, half * 2, thickness)
    ctx.fillStyle = '#d6aa28'
    ctx.fillRect(-half, -thickness / 2, half * .12, thickness)
    ctx.fillRect(half * .88, -thickness / 2, half * .12, thickness)
  }
}
