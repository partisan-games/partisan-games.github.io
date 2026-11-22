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
      if (attack.effect) {
        this.muzzleFlash = new ArtClip(attack.effect)
        this.children.push(this.muzzleFlash)
      }
      this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.projection.point(this.body.muzzle) } })
      this.sounds.push(this.shotSound)
      this.shotsSeen = body.shotsFired
      this.sinceShot = Infinity
    }
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.clip = body.state === 'move' ? 'drive' : 'idle'
    this.clipTime = body.alive ? body.stateTime : 0
    if (this.fireArt) {
      this.sinceShot += dt
      if (body.shotsFired > this.shotsSeen) {
        this.sinceShot = 0
        this.shotSound.play()
        this.shotPoint = this.projection.point(body.muzzle)
      }
      this.shotsSeen = body.shotsFired
      if (this.muzzleFlash) this.placeFlash()
      this.syncViews(body.shells.projectiles, shell => new ShellSprite(shell, this.projection, this.camera))
    }
  }

  placeFlash() {
    const flash = this.muzzleFlash
    flash.visible = this.body.state === 'attack' && this.sinceShot < flash.seconds('fire')
    if (!flash.visible) return
    const { frame } = flash.sample('fire', this.sinceShot)
    const { muzzleX, smokeStep } = flash.art
    // The flame follows recoil. The two smoke poses drift from the original discharge point.
    const barrel = this.fireArt.sample('fire', this.sinceShot).frame
    const dx = frame < 2 ? muzzleX[barrel] - muzzleX[0] : (frame - 1) * smokeStep.x
    const dy = frame < 2 ? 0 : (frame - 1) * smokeStep.y
    flash.setPosition(this.shotPoint.x + dx * this.artScale * this.flipY, this.shotPoint.y + dy * this.artScale)
  }

  render(ctx) {
    if (!this.shown) return
    const firing = this.body.state === 'attack' && this.fireArt && this.sinceShot < this.fireTime
    const [left, , right] = this.art.body
    const anchorX = this.x + (this.art.anchor.x - (left + right) / 2) * this.artScale * this.flipY
    if (firing && this.fireArt.draw(ctx, { name: 'fire', time: this.sinceShot, x: anchorX, y: this.y + this.height / 2,
      scaleX: this.artScale, flip: this.flipY })) {
      const flash = this.muzzleFlash
      if (flash?.visible) flash.draw(ctx, { name: 'fire', time: this.sinceShot, x: flash.x, y: flash.y,
        scaleX: this.artScale * flash.art.scale, flip: this.body.forward })
      return
    }
    super.render(ctx)
  }
}
