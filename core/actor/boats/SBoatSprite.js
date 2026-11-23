import HullSprite from './HullSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { renderSinking, sinking } from './SinkingWreck.js'
import { bodyImage } from '../wreckView.js'
import ArtClip from '../ArtClip.js'
import art from './sBoatArt.js'
import geometry from '/core/gameplay/sBoatGeometry.js'

/**
 * How the German S-boat looks and sounds from above: its hull with its two deck guns turned to their aim, its engine
 * and shots, and once hit hard, its slow sinking with smoke and bubbles. It only reads the body.
 */
export default class SBoatSprite extends HullSprite {
  /** Its deck guns, as shares of its length ahead of its middle. */
  static mounts = geometry.mounts

  constructor(body, { projection, camera }) {
    super(body, art.src, { projection, camera })
    this.gun = new ArtClip(art.gun)
    this.children.push(this.gun)
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
    const damage = this.body.dead && this.damageArt?.image
    const hull = damage?.complete && damage.naturalWidth ? damage : bodyImage(this)
    ctx.drawImage(hull, -this.width / 2, -this.height / 2, this.width, this.height)
    for (const mount of SBoatSprite.mounts) {
      ctx.save()
      ctx.translate(mount * this.width, 0)
      ctx.rotate(this.projection.angle(this.body.gunYaw) - this.angle)
      const gunScale = this.width * geometry.gunReach / (art.gun.muzzle[0] - art.gun.anchor.x)
      this.gun.draw(ctx, { name: 'idle', time: 0, x: 0, y: 0, scaleX: gunScale })
      ctx.restore()
    }
    ctx.restore()
  }
}
