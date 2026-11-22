import HullSprite from './HullSprite.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import { renderSinking, sinking } from './SinkingWreck.js'
import looks from '../patrolBoatLooks.js'
import { vesselLooks, actorArt } from '../reinforcementArt.js'
import ArtClip from '../ArtClip.js'
import { bodyImage } from '../wreckView.js'

/** The shared generated hull, fixed bow gun and wreck, with the existing sea effects and sounds. */
export default class PatrolBoatSprite extends HullSprite {
  constructor(body, { id = 'german-launch', projection, camera }) {
    const art = looks[id] ?? vesselLooks[id]
    super(body, art.src, { projection, camera })
    this.art = art
    this.wreck = new GameObject2D(art.wreck, { visible: false })
    this.wreck.render = () => {}
    this.flash = new MuzzleFlash(camera ?? { cameraX: 0, cameraY: 0 })
    this.effects = { position: { z: -2 }, render: ctx => this.body.dead && renderSinking(ctx, this, this.body.stateTime) }
    this.children.push(this.wreck, this.flash, this.effects)
    if (art.crew) {
      this.deckCrew = new ArtClip(actorArt['deck-crew'])
      this.children.push(this.deckCrew)
    }
    this.elapsed = 0
    const spatial = { getPosition: () => this.position }
    this.engineSound = new Sound('engine-boat.mp3', { loop: true, profile: 'engine', spatial })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial })
    this.sinkingSound = new Sound('water-impact.mp3', { profile: 'impact', spatial })
    this.sounds.push(this.engineSound, this.shotSound, this.sinkingSound)
    this.seen = { shots: body.shotsFired, alive: body.alive }
  }

  update(dt) {
    super.update(dt)
    this.elapsed += dt
    const { body, seen } = this
    this.engineSound.setPlaying(body.alive)
    this.position.z = body.alive || body.afloat ? 0 : .5
    if (body.shotsFired > seen.shots) {
      this.shotSound.play()
      this.flash.start(this.projection.point(body.muzzle), this.projection.angle(body.gunYaw))
    }
    if (seen.alive && body.dead) this.sinkingSound.play()
    if (body.dead) this.flash.hide()
    Object.assign(seen, { shots: body.shotsFired, alive: body.alive })
    this.syncRounds()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const sunk = this.body.dead ? Math.min(1, this.body.stateTime / sinking.hull) : 0
    if (sunk >= 1) return
    const scale = this.projection.pxPerMeter / 25
    const [width, height] = this.art.frame.map(value => value * scale)
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.globalAlpha = (1 - sunk) ** .7
    ctx.scale(1 - sunk * .08, 1 - sunk * .45)
    const image = this.body.dead && this.wreck.image.naturalWidth ? this.wreck.image : bodyImage(this)
    ctx.drawImage(image, -width / 2, -height / 2, width, height)
    if (this.body.alive && this.deckCrew)
      for (const [x, y] of this.art.crew.positions)
        this.deckCrew.draw(ctx, { name: 'idle', time: this.elapsed,
          x: (x - this.art.frame[0] / 2) * scale, y: (y - this.art.frame[1] / 2) * scale, scaleX: scale })

    ctx.restore()
  }
}
