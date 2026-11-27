import ActorAtlas from '/core/actor/ActorAtlas.js'
import { gunCarrierPictures } from '/core/actor/vehicles/GunCarrierSprite.js'
import { gunCarrierKinds } from '/core/gameplay/bodies/vehicles/GunCarrier.js'
import Sound from '/core/io/audio/SoundSource.js'
import VehicleGun from './VehicleGun.js'

/**
 * Each one's gun while it is in sight: the armoured car's 20 mm cannon in short, hard bursts, the half-track's machine
 * gun in lighter, more frequent ones, so that crossing the screen either takes about a seventh of the player's health.
 */
const guns = { armoredCar: { interval: 1.2, damage: 3 }, halftrack: { interval: .9, damage: 2 } }
/** How long a burst shows its firing pictures. */
const burst = .4

/**
 * A German armoured car (`armoredCar`, the Sd.Kfz. 222) or half-track (`halftrack`, the Sd.Kfz. 251) that crosses the
 * street as the tank does, at its own speed and size in metres, `pixelsPerMeter` on the screen, its wheels on `feet`:
 * bullets glance off it and one grenade on it wrecks it, which leaves it burnt out where it stopped. While it is in
 * sight of the `camera` (`cameraX`, `width`) it fires, each burst hitting the player through `onShot(damage)`.
 */
export default class CrossingArmoredCar {
  constructor({ kind, x, feet, pixelsPerMeter, direction, camera, onShot = () => {} }) {
    this.picture = gunCarrierPictures[kind]
    this.sheet = new ActorAtlas(this.picture)
    this.children = [this.sheet]
    this.gun = new VehicleGun(guns[kind])
    this.shotSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => ({ x: this.x, y: this.feet }) } })
    this.sounds = [this.shotSound]
    const { size, speed } = gunCarrierKinds[kind]
    Object.assign(this, { x, feet, pixelsPerMeter, direction, speed, camera, onShot })
    this.width = size.length * pixelsPerMeter
    this.height = size.height * pixelsPerMeter
    this.layer = -.5
    this.travelTime = 0
    this.armor = 1
  }

  get destroyed() {
    return this.armor === 0
  }

  /** In sight of the player, wholly or in part. */
  get inSight() {
    return this.x + this.width / 2 > this.camera.cameraX && this.x - this.width / 2 < this.camera.cameraX + this.camera.width
  }

  update(dt) {
    this.travelTime += dt
    if (this.destroyed) return
    this.x += this.direction * this.speed * this.pixelsPerMeter * dt
    if (!this.gun.update(dt, this.inSight)) return
    this.shotSound.play()
    this.onShot(this.gun.damage)
  }

  contains(x, y) {
    return Math.abs(x - this.x) < this.width / 2 && y < this.feet && y > this.feet - this.height
  }

  blast(x, y) {
    if (this.destroyed || !this.contains(x, y)) return false
    this.armor--
    return true
  }

  render(ctx) {
    ctx.save()
    ctx.translate(this.x, this.feet - this.height / 2)
    // the pictures face their own way; turned to the way it drives
    ctx.scale(this.direction * this.picture.facing, 1)
    const firing = this.gun.sinceShot < burst
    this.sheet.drawLocal(ctx, this, this.destroyed ? 'dead' : firing ? 'attack' : 'drive',
      firing ? this.gun.sinceShot : this.travelTime)
    ctx.restore()
  }
}
