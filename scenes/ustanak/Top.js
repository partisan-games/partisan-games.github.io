import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Health from '/core/gameplay/Health.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import Collider from '/core/collision/Collider.js'
import { box, circle, fromImage } from '/core/collision/shapes.js'
import Djule from './Djule.js'
import Terrain from './Terrain.js'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * The force of a shot, at least and at most, and how much holding fire adds to it per second; how fast the barrel
 * rises and sinks, in radians per second; how far a shot throws the cannon back, and how fast it rolls forward again.
 */
export const cannon = { minForce: 300, maxForce: 900, chargeRate: 300, aimRate: .5, recoil: 5, recoilReturn: 20 }

const scale = .75
const minElevation = Math.PI * 2 - 6.2
const maxElevation = Math.PI * 2 - 5.68
/** The elevations `aimAt` tries, from the highest down, so the farther the point, the higher the barrel. */
const aimStep = .005

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
const carriageOffset = { x: -40, y: 32 } // from the barrel, for a cannon facing right

/**
 * The cannon stands, or fires where `aimAt` set it as soon as its last shot is over. Each lasts until it is set to
 * another; who aims and fires it, and when, is up to the world.
 */
const states = {
  idle: {},
  fire: {
    update: top => {
      if (top.hasActiveShot || top.aimedForce === null) return
      top.sila = top.aimedForce
      top.launch()
    },
  },
}

export default class Top extends GameObject2D {
  /** The ground line under the wheel of a cannon whose barrel is at y. */
  static floorY(y) {
    return y + carriageOffset.y + floorBelowCarriage
  }

  constructor({
    x, y, clock, wind, terrain = new Terrain({ floorY: Top.floorY(y) }), targets = [], direction = 1,
    canFire = () => true, onFire = () => {},
  } = {}) {
    super('armies/game-ready/artiljerija/top-cev.gif', { x, y, scale, flammable: true })
    this.direction = direction
    this.flipX = direction
    this.postolje = new GameObject2D('armies/game-ready/artiljerija/top-postolje.gif', {
      x: x + carriageOffset.x * direction, y: y + carriageOffset.y, scale, scaleX: direction,
    })
    this.pocetniX = x
    this.pocetniY = y
    this.elevation = .2
    this.sila = this.minSila = cannon.minForce
    this.maxForce = cannon.maxForce
    this.aimedForce = null
    this.children = []
    this.granate = new ProjectilePool({ owner: this, create: () => new Djule({ clock, wind, ground: terrain }) })
    this.granate.prepare(5)
    this.children.push(this.postolje)
    this.collider = new Collider([
      { body: this, shapes: barrelShapes },
      { body: this.postolje, shapes: carriageShapes },
    ])
    this.targets = targets
    this.health = new Health()
    this.canFire = canFire
    this.onFire = onFire
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => ({ x: this.vrhX, y: this.vrhY }) } })
    this.sounds.push(this.shotSound)
    this.machine = new StateMachine(this, states, 'idle')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  get energija() {
    return this.health.current
  }

  resetRound() {
    this.audioRevision = (this.audioRevision ?? 0) + 1
    this.granate.projectiles.forEach(projectile => projectile.reset())
    for (const owner of [this, ...this.granate.projectiles]) owner.sounds.forEach(sound => sound.stop())
    this.health.reset()
    this.x = this.pocetniX
    this.standAt(0)
    this.stop()
    this.elevation = .2
    this.sila = this.minSila
    this.flame?.clear()
  }

  /** Where the wheel stands: a crater there lets the whole cannon sink. */
  get footX() {
    return this.postolje.x + (wheel.x - carriageImage.width / 2) * scale * this.direction
  }

  standAt(depth) {
    this.y = this.pocetniY + depth
    this.postolje.y = this.pocetniY + carriageOffset.y + depth
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
    return this.granate.projectiles.some(projectile => projectile.visible || projectile.timerId !== null)
  }

  launch() {
    if (this.dead || !this.canFire() || this.hasActiveShot) return false
    this.granate.fire({ x: this.vrhX, y: this.vrhY }, this.angle, this.sila)
    this.shotSound.play()
    this.x -= cannon.recoil * this.direction
    this.sila = this.minSila
    this.onFire()
    return true
  }

  /** Builds up the force of the next shot while fire is held. */
  charge(dt) {
    this.sila = Math.min(this.maxForce, this.sila + cannon.chargeRate * dt)
  }

  /** Whether fire has been held, so letting it go fires. */
  get charged() {
    return this.sila > this.minSila
  }

  /** Raises the barrel for `way` 1, or lowers it for -1. */
  turnBarrel(way, dt) {
    this.elevation += way * cannon.aimRate * dt
  }

  /** The way the cannon faces: 1 right, -1 left. */
  get forward() {
    return this.direction
  }

  /** As far as the strongest shot carries over level ground, with the barrel highest and no wind. */
  get reach() {
    return this.maxForce ** 2 * Math.sin(2 * maxElevation) / this.granate.projectiles[0].gravity
  }

  /** Points on the ground ahead: a near one takes a low barrel, a far one a raised barrel. */
  get shots() {
    const ground = Top.floorY(0)
    return { straight: { x: 700, y: ground }, up: { x: 1000, y: ground } }
  }

  /**
   * The force that throws a shell from the muzzle to `point` at `elevation`, which the barrel is set to, with the
   * wind, or null when no throw at it gets there.
   */
  forceFor(point, elevation = this.elevation) {
    const { gravity, wind } = this.granate.projectiles[0]
    const distance = Math.abs(point.x - this.vrhX)
    const height = point.y - this.vrhY
    const acceleration = this.direction * (wind?.acceleration || 0)
    const timeSquared = 2 * (distance * Math.tan(elevation) + height) / (gravity + acceleration * Math.tan(elevation))
    return timeSquared > 0
      ? (distance - acceleration * timeSquared / 2) / (Math.cos(elevation) * Math.sqrt(timeSquared))
      : null
  }

  /**
   * Sets the barrel and the force of the next shot for `point`, at the highest elevation whose force the cannon
   * has, and gives whether the point is ahead and within reach. An unreachable point leaves the aim as it was.
   */
  aimAt(point) {
    if (Math.sign(point.x - this.x) !== this.direction) return false
    const { elevation } = this
    for (let tried = maxElevation; tried >= minElevation; tried -= aimStep) {
      this.elevation = tried
      const force = this.forceFor(point)
      if (force !== null && force >= this.minSila && force <= this.maxForce) {
        this.aimedForce = force
        return true
      }
    }
    this.elevation = elevation
    return false
  }

  /** After everything has moved in a step, so a shell sees its whole way and where the targets ended. */
  resolveShots() {
    const targets = this.targets.filter(target => target.alive)
    this.granate.projectiles.forEach(projectile => projectile.resolveFlight(targets))
  }

  takeHit(damage) {
    this.health.damage(damage)
  }

  update(dt) {
    this.collider.beginStep()
    if (this.alive) this.machine.update(dt)
    super.update(dt)
    const recoil = this.pocetniX - this.x
    this.x += Math.sign(recoil) * Math.min(Math.abs(recoil), cannon.recoilReturn * dt)
  }
}
