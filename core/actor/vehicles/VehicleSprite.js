import AtlasSprite from '/core/actor/AtlasSprite.js'
import ArtClip from '/core/actor/ArtClip.js'
import Sound from '/core/io/audio/SoundSource.js'
import ShellSprite from '/core/actor/projectiles/ShellSprite.js'

/**
 * How a truck, tank or train body looks in 2D, from its atlas `art`, which points the way `facing` says: standing with
 * its engine running, driving, or burning as a wreck. It only reads the body.
 */
export default class VehicleSprite extends AtlasSprite {
  constructor(body, { art, attack, facing, projection, camera }) {
    super(body, art, { facing, projection, camera, flammable: true })
    if (attack && body.shells) {
      this.fireArt = new ArtClip(attack)
      this.fireTime = this.fireArt.seconds('fire')
      this.children.push(this.fireArt)
      this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.projection.point(this.body.muzzle) } })
      this.sounds.push(this.shotSound)
      this.shotsSeen = body.shotsFired
      this.sinceShot = Infinity
    }
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.clip = body.state === 'drive' ? 'drive' : 'idle'
    this.clipTime = body.alive ? body.stateTime : 0
    if (this.fireArt) {
      this.sinceShot += dt
      if (body.shotsFired > this.shotsSeen) {
        this.sinceShot = 0
        this.shotSound.play()
      }
      this.shotsSeen = body.shotsFired
      this.syncViews(body.shells.projectiles, shell => new ShellSprite(shell, this.projection, this.camera))
    }
  }

  render(ctx) {
    if (!this.shown) return
    const firing = this.body.alive && this.fireArt && this.sinceShot < this.fireTime && this.body.state !== 'drive'
    if (firing && this.fireArt.draw(ctx, { name: 'fire', time: this.sinceShot, x: this.x, y: this.y + this.height / 2,
      scaleX: this.artScale, flip: this.flipY })) return
    super.render(ctx)
  }
}
