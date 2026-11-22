import StandingSprite from '/core/actor/StandingSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import ustanakArt from '/core/actor/ustanakArt.js'
import ArtClip from '/core/actor/ArtClip.js'
import { partisanCrewDeath, italianCrewDeath } from '/core/actor/actionArt.js'

/**
 * How a gun crew looks and sounds, partisan or `italian`, drawn facing right: standing by, loading with the sound of
 * the ramrod, and firing, which plays the shot and then its recoil. It only reads the body.
 */
export default class CannonCrewSprite extends StandingSprite {
  constructor(body, { italian = false, projection, camera }) {
    super(body, italian ? ustanakArt.italianCrew : ustanakArt.partisanCrew, { projection, camera })
    this.loadSound = new Sound('cannon-load.mp3', { volume: .65, profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.loadSound)
    this.deathArt = new ArtClip(italian ? italianCrewDeath : partisanCrewDeath)
    this.children.push(this.deathArt)
  }

  update(dt) {
    super.update(dt)
    const { body, art } = this
    const { state, stateTime } = body
    if (body.dead) {
      this.loadSound.stop()
      return
    }
    if (state !== 'load') this.loadSound.stop()
    else if (this.seenState !== 'load') this.loadSound.play()
    this.seenState = state
    const fired = state === 'fire' && stateTime >= art.durations.fire
    this.clip = state === 'fire' ? fired ? 'recoil' : 'fire' : state
    this.clipTime = fired ? stateTime - art.durations.fire : stateTime
    this.loop = state === 'idle'
  }

  render(ctx) {
    if (!this.shown) return
    if (this.renderHit(ctx)) return
    if (this.body.dead && this.deathArt.draw(ctx, {
      name: 'death', time: this.body.stateTime, x: this.x, y: this.y + this.height / 2,
      scaleX: this.width / 128, scaleY: this.height / 128, flip: this.flipY,
    })) return
    super.render(ctx)
  }
}
