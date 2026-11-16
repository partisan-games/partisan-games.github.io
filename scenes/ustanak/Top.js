import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import Health from '/core/gameplay/Health.js'
import Collider from '/core/collision/Collider.js'
import { box, circle, fromImage } from '/core/collision/shapes.js'
import Djule from './Djule.js'

const scale = .75
const minElevation = Math.PI * 2 - 6.2
const maxElevation = Math.PI * 2 - 5.68
const chargeRate = 300

// Measured on the images in their pixels; their transparent edges and the ground under the carriage are no target.
const barrelShapes = fromImage({ width: 274, height: 52 }, scale, [
  box(160, 36, 228, 12), // barrel and breech
  box(84.5, 46.5, 169, 9), // cradle
  box(91, 15, 32, 7, Math.atan2(30, 12)), // lever
  box(56, 26, 14, 8), // sight
])
const carriageImage = { width: 400, height: 99 }
const wheel = { x: 220.5, y: 64.5, r: 31.5 }
const carriageShapes = fromImage(carriageImage, scale, [
  circle(wheel.x, wheel.y, wheel.r),
  box(122.5, 80.5, 136, 12, -.096), // trail
  box(29.5, 81.5, 7, 13), // spade
])
// Shells land where the wheels and the crews stand, below the far edge of the field.
const floorBelowCarriage = (wheel.y + wheel.r - carriageImage.height / 2) * scale

export default class Top extends GameObject2D {
  constructor({ x, y, clock, wind, targets = [], direction = 1, canFire = () => true, onFire = () => {} } = {}) {
    super('armies/game-ready/artiljerija/top-cev.gif', { x, y, scale, flammable: true })
    this.direction = direction
    this.flipX = direction
    this.postolje = new GameObject2D('armies/game-ready/artiljerija/top-postolje.gif', { x: x - 40 * direction, y: y + 32, scale, scaleX: direction })
    this.pocetniX = x
    this.pocetniY = y
    this.elevation = .2
    this.sila = this.minSila = 300
    this.maxForce = this.minSila * 3
    this.projektili = Array.from({ length: 5 }, () => new Djule({ clock, wind, groundLevel: this.postolje.y + floorBelowCarriage }))
    this.children = [...this.projektili, this.postolje]
    this.collider = new Collider([
      { body: this, shapes: barrelShapes },
      { body: this.postolje, shapes: carriageShapes },
    ])
    this.targets = targets
    this.health = new Health()
    this.canFire = canFire
    this.onFire = onFire
  }

  get energija() {
    return this.health.current
  }

  resetRound() {
    this.projektili.forEach(projectile => projectile.reset())
    this.health.reset()
    this.setPosition(this.pocetniX, this.pocetniY)
    this.stop()
    this.elevation = .2
    this.sila = this.minSila
    this.flame?.clear()
  }

  get alive() {
    return this.health.alive
  }

  set alive(value) {
    if (!this.health) return
    if (value) this.health.reset()
    else this.health.damage(this.health.current)
  }

  get burning() {
    return this.flammable && this.health.current <= 20
  }

  get vrhX() {
    return this.x + this.width * .5 * Math.cos(this.angle) - 8 * this.direction * Math.sin(this.angle)
  }

  get vrhY() {
    return this.y + this.width * .5 * Math.sin(this.angle) + 8 * this.direction * Math.cos(this.angle)
  }

  get elevation() {
    return this.direction === 1 ? (Math.PI * 2 - this.angle) % (Math.PI * 2) : this.angle - Math.PI
  }

  set elevation(value) {
    const angle = Math.max(minElevation, Math.min(maxElevation, value))
    this.angle = this.direction === 1 ? -angle : Math.PI + angle
  }

  get hasActiveShot() {
    return this.projektili.some(projectile => projectile.visible || projectile.timerId !== null)
  }

  launch() {
    if (this.dead || !this.canFire() || this.hasActiveShot) return false
    const projektil = this.projektili.find(p => !p.visible)
    if (!projektil) return false

    const position = { x: this.vrhX, y: this.vrhY }
    projektil.launch(position, this.angle, this.sila)
    this.x -= 5 * this.direction
    this.sila = this.minSila
    this.onFire()
    return true
  }

  handleInput(dt) {
    if (keyboard.isDown(keys.shoot))
      this.sila = Math.min(this.maxForce, this.sila + chargeRate * dt)
    else if (this.sila > this.minSila)
      this.launch()

    if (keyboard.isDown(keys.up))
      this.elevation += .5 * dt
    if (keyboard.isDown(keys.down))
      this.elevation -= .5 * dt
  }

  /** After everything has moved in a step, so a shell sees its whole way and where the targets ended. */
  resolveShots() {
    const targets = this.targets.filter(target => target.alive)
    this.projektili.forEach(projectile => projectile.resolveFlight(targets))
  }

  takeHit(damage) {
    this.health.damage(damage)
  }

  update(dt) {
    this.collider.beginStep()
    super.update(dt)
    const recoil = this.pocetniX - this.x
    this.x += Math.sign(recoil) * Math.min(Math.abs(recoil), 20 * dt)
  }
}
