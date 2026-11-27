import AdvanceSprite from '/core/actor/AdvanceSprite.js'
import Sound from '/core/io/audio/SoundSource.js'

/** Metres a second, as slow as the Panzer, so the player sees what it does. */
const speed = 4
/** How long its firing pictures show after a shot, in seconds. */
const firing = .34

/**
 * A Red Army T-34-85 that drives across the street on `feet`, at `pixelsPerMeter`, from `x` the way of `direction`.
 * While in sight of the `camera` (`cameraX`, `width`) it fires: `first` seconds after it comes into sight and then
 * every `interval` seconds it asks `onShot()` to hit a German, `shells` times at most, and keeps its shell when there
 * is none to hit. Neither side's fire stops it.
 */
export default class ReliefTank {
  constructor({ x, feet, pixelsPerMeter, direction, camera, first = 1, interval = 1.6, shells = 3, onShot = () => false }) {
    this.sprite = new AdvanceSprite('t34')
    this.children = [...this.sprite.children]
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => ({ x: this.x, y: this.feet }) } })
    this.sounds = [this.shotSound]
    Object.assign(this, { x, feet, pixelsPerMeter, direction, camera, interval, shells, onShot })
    this.width = this.sprite.worldWidth * pixelsPerMeter
    this.layer = -.5
    this.travelTime = 0
    this.wait = first
    this.sinceShot = Infinity
  }

  /** In sight of the player, wholly or in part. */
  get inSight() {
    return this.x + this.width / 2 > this.camera.cameraX && this.x - this.width / 2 < this.camera.cameraX + this.camera.width
  }

  /** Gone past the far edge of the view. */
  get passed() {
    return this.direction > 0 ? this.x - this.width / 2 > this.camera.cameraX + this.camera.width
      : this.x + this.width / 2 < this.camera.cameraX
  }

  update(dt) {
    this.travelTime += dt
    this.sinceShot += dt
    this.x += this.direction * speed * this.pixelsPerMeter * dt
    if (!this.inSight || this.shells === 0) return
    this.wait -= dt
    if (this.wait > 0 || !this.onShot()) return
    this.wait = this.interval
    this.shells--
    this.sinceShot = 0
    this.shotSound.play()
  }

  render(ctx) {
    const shot = this.sinceShot < firing
    const draw = { x: this.x, y: this.feet, scale: this.pixelsPerMeter, flip: this.direction }
    this.sprite.draw(ctx, { ...draw, name: shot ? 'fire' : 'drive', time: shot ? this.sinceShot : this.travelTime })
    if (shot) this.sprite.drawShot(ctx, { ...draw, name: 'fire', age: this.sinceShot })
  }
}
