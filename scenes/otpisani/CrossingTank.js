import AdvanceSprite from '/core/actor/AdvanceSprite.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import Sound from '/core/io/audio/SoundSource.js'
import VehicleGun from './VehicleGun.js'

const speed = 5.5
// Visible hull and turret in the shared Panzer III atlas, with the antenna and barrel excluded.
const target = [[0, 188, 454, 282], [166, 107, 314, 188]]
/** The tip of the barrel in the same atlas, measured on its drive frames. */
const muzzle = { x: 401, y: 149 }
/** A shell every few seconds while it is in sight, each a tenth of the player's health. */
const gun = { interval: 3.5, damage: 10 }

export default class CrossingTank {
  /** `camera` (`cameraX`, `width`) tells when it is in sight to fire; `onShot(damage)` is each of its hits. */
  constructor({ x, feet, pixelsPerMeter, direction, camera, onShot = () => {} }) {
    this.sprite = new AdvanceSprite('tank')
    this.flash = new MuzzleFlash(camera)
    this.children = [...this.sprite.children, this.flash]
    this.gun = new VehicleGun(gun)
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.muzzle } })
    this.sounds = [this.shotSound]
    Object.assign(this, { camera, onShot })
    this.x = x
    this.feet = feet
    this.pixelsPerMeter = pixelsPerMeter
    this.direction = direction
    this.width = this.sprite.worldWidth * pixelsPerMeter
    this.layer = -.5
    this.travelTime = 0
    this.armor = 2
  }

  get destroyed() {
    return this.armor === 0
  }

  /** Where the barrel's tip is on the screen. */
  get muzzle() {
    const { anchor, standingPixels } = this.sprite.sheet.art
    const scale = this.pixelsPerMeter * this.sprite.height / standingPixels
    return { x: this.x + this.direction * (muzzle.x - anchor.x) * scale, y: this.feet + (muzzle.y - anchor.y) * scale }
  }

  /** In sight of the player, wholly or in part. */
  get inSight() {
    return this.x + this.width / 2 > this.camera.cameraX && this.x - this.width / 2 < this.camera.cameraX + this.camera.width
  }

  update(dt) {
    if (this.destroyed) return
    this.travelTime += dt
    this.x += this.direction * speed * this.pixelsPerMeter * dt
    if (!this.gun.update(dt, this.inSight)) return
    this.flash.start(this.muzzle, this.direction > 0 ? 0 : Math.PI)
    this.shotSound.play()
    this.onShot(gun.damage)
  }

  contains(x, y) {
    const { anchor, standingPixels } = this.sprite.sheet.art
    const scale = this.pixelsPerMeter * this.sprite.height / standingPixels
    const localX = (x - this.x) * this.direction / scale + anchor.x
    const localY = (y - this.feet) / scale + anchor.y
    return target.some(([left, top, right, bottom]) =>
      localX >= left && localX <= right && localY >= top && localY <= bottom)
  }

  blast(x, y) {
    if (this.destroyed || !this.contains(x, y)) return false
    this.armor--
    return true
  }

  render(ctx) {
    ctx.save()
    if (this.armor < 2) ctx.filter = this.destroyed ? 'brightness(.48) saturate(.4)' : 'brightness(.8)'
    this.sprite.draw(ctx, { name: 'drive', time: this.travelTime, x: this.x, y: this.feet,
      scale: this.pixelsPerMeter, flip: this.direction, crewVisible: !this.destroyed })
    ctx.restore()
  }
}
