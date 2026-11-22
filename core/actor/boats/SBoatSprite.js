import HullSprite from './HullSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { renderSinking, sinking } from './SinkingWreck.js'
import { bodyImage } from '../wreckView.js'

/**
 * How the German S-boat looks and sounds from above: its hull with its two deck guns turned to their aim, its engine
 * and shots, and once hit hard, its slow sinking with smoke and bubbles. It only reads the body.
 */
export default class SBoatSprite extends HullSprite {
  /** Its deck guns, as shares of its length ahead of its middle. */
  static mounts = [-84 / 300, 101 / 300]

  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/brodovi/schnellboot-s30.svg', { projection, camera })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.engineSound = new Sound('engine-boat.mp3', { volume: .25, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sinkingSound = new Sound('water-impact.mp3', { profile: 'impact', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.engineSound, this.sinkingSound)
    this.seen = { shots: body.shotsFired, alive: body.alive }
    this.effects = { position: { z: -2 }, render: ctx => this.body.dead && renderSinking(ctx, this, this.body.stateTime) }
    this.children.push(this.effects)
  }

  update(dt) {
    super.update(dt)
    const { body, seen } = this
    // a sinking hull lies under the boats that pass over it
    this.position.z = body.afloat || body.alive ? 0 : .5
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > seen.shots) this.shotSound.play()
    if (seen.alive && body.dead) this.sinkingSound.play()
    Object.assign(seen, { shots: body.shotsFired, alive: body.alive })
    this.syncRounds()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const sunk = this.body.dead ? Math.min(1, this.body.stateTime / sinking.hull) : 0
    if (sunk >= 1) return
    ctx.save()
    ctx.globalAlpha = (1 - sunk) ** .7
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(1 - sunk * .08, 1 - sunk * .45)
    ctx.drawImage(bodyImage(this), -this.width / 2, -this.height / 2, this.width, this.height)
    for (const mount of SBoatSprite.mounts) {
      ctx.save()
      ctx.translate(mount * this.width, 0)
      ctx.rotate(this.projection.angle(this.body.gunYaw) - this.angle)
      const gunScale = this.width / 300
      ctx.scale(gunScale, gunScale)
      ctx.fillStyle = '#33483e'
      ctx.fillRect(-4, -2.5, 10, 5)
      ctx.fillStyle = '#aab8a1'
      ctx.fillRect(-3, -2, 6, 1)
      ctx.fillStyle = '#23352e'
      ctx.fillRect(3, -1, 9, 2)
      ctx.fillRect(9, -1.5, 3, 3)
      ctx.restore()
    }
    ctx.restore()
  }
}
