import AdvanceSprite, { advanceHeight } from '/core/actor/AdvanceSprite.js'
import art from '/core/actor/advanceArt.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import Sound from '/core/io/audio/SoundSource.js'
import VehicleGun from './VehicleGun.js'

/** Metres a second: slow enough that a grenade thrown at it lands on it, unless at its very tail (owner, 2026-11-27). */
const speed = 4
// Visible hull and turret in the shared Panzer III atlas, with the antenna and barrel excluded.
const target = [[0, 188, 454, 282], [166, 107, 314, 188]]
/** The commander's head and shoulders above the hatch, in his own atlas, measured on his idle frames. */
const commander = [0, 28, 44, 84]
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
    /** Seconds since a bullet hit the commander, or null while he looks out. */
    this.commanderHit = null
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
    if (this.commanderHit !== null) this.commanderHit += dt
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

  /** A bullet at `x`, `y` fells the commander looking out of the turret; the tank drives and fires on without him. */
  shootCommander(x, y) {
    if (this.destroyed || this.commanderHit !== null) return false
    const { crewAnchor, anchor, standingPixels } = this.sprite.sheet.art
    const hull = this.pixelsPerMeter * this.sprite.height / standingPixels
    const scale = this.pixelsPerMeter * advanceHeight.commander / art.commander.standingPixels
    const localX = ((x - this.x) * this.direction - (crewAnchor.x - anchor.x) * hull) / scale + art.commander.anchor.x
    const localY = (y - this.feet - (crewAnchor.y - anchor.y) * hull) / scale + art.commander.anchor.y
    const [left, top, right, bottom] = commander
    if (localX < left || localX > right || localY < top || localY > bottom) return false
    this.commanderHit = 0
    return true
  }

  /** The commander looks out, then takes the hit and hangs over the hatch. */
  get crewPose() {
    if (this.commanderHit === null) return { crewName: 'idle', crewTime: this.travelTime }
    const hit = this.sprite.crew.seconds('hit')
    return this.commanderHit < hit ? { crewName: 'hit', crewTime: this.commanderHit }
      : { crewName: 'dead', crewTime: this.commanderHit - hit }
  }

  blast(x, y) {
    if (this.destroyed || !this.contains(x, y)) return false
    this.armor--
    return true
  }

  render(ctx) {
    const condition = this.destroyed ? 'dead' : this.armor < 2 ? 'damaged' : undefined
    this.sprite.draw(ctx, { name: 'drive', time: this.travelTime, x: this.x, y: this.feet,
      scale: this.pixelsPerMeter, flip: this.direction, condition, ...this.crewPose })
  }
}
