import Sound from '/core/io/audio/SoundSource.js'
import Player2D from '/core/actor/Player2D.js'
import { frames } from '/core/constants.js'
import canvas2d from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from '/core/actor/targeting.js'
import WorldRocket, { inheritVelocity } from './WorldRocket.js'
import { outsideView } from './view.js'
import Explosion from './Explosion.js'

const tiltRate = 0.01
const maxTilt = 0.066
const gravity = 3
/** A shot down plane falls faster than a flying one sinks, and tumbles nose over tail, in radians per second. */
const wreckGravity = gravity * 30
const tumbleRate = 2.5
/**
 * Airspeed in pixels per second: the speed at takeoff, the slowest and fastest flight, and the change per frame of
 * throttle. Full throttle adds 600 to the takeoff speed, as it did when the scenery scrolled.
 */
export const airspeed = { start: 312, min: 200, max: 912, throttle: 5 }
/** How high above the ground the plane can climb, in pixels. */
export const ceiling = 5555

/**
 * Franjo Kluz's Potez 25 in world coordinates. The camera moves on at the plane's airspeed; left and right change
 * that speed and also move the plane forward and back across the screen, up and down climb and dive.
 */
export default class Potez extends Player2D {
  constructor({ groundY, camera, session, x = 200, y = 200 }) {
    super('armies/partizani/potez-25.png', { x, y, scale: .55, flammable: true, attackKey: 'Space', buttonDict: { attack: '🚀', special: '🎯' } })
    this.groundY = groundY
    this.camera = camera
    this.session = session
    this.airspeed = airspeed.start
    /** Speed across the screen, on top of the airspeed the camera keeps. */
    this.screenDx = 0
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.explosionSound)
    /** A burst when the plane is hit and another when its wreck hits the ground; loaded with the plane. */
    this.bursts = [new Explosion(camera), new Explosion(camera)]
    this.children.push(...this.bursts)
    /** Whether the shot down plane has hit the ground. */
    this.wrecked = false
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new WorldRocket(camera), onFire: inheritVelocity(this) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: 1.5, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500),
    })
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  get isGrounded() {
    return this.y + this.height / 2 >= this.groundY
  }

  get atCeiling() {
    return this.y - this.height / 2 <= this.groundY - ceiling
  }

  /** KOMANDE ***/

  handleInput(dt) {
    super.handleInput(dt)
    if (this.input.special) this.shootAimed()
  }

  moveRight(dt) {
    this.airspeed = Math.min(airspeed.max, this.airspeed + airspeed.throttle * frames(dt))
    this.screenDx += this.thrust * frames(dt, this.tunedFps)
  }

  moveLeft(dt) {
    if (this.isGrounded) return
    this.airspeed = Math.max(airspeed.min, this.airspeed - airspeed.throttle * frames(dt))
    this.screenDx -= this.thrust * frames(dt, this.tunedFps)
  }

  moveUp(dt) {
    if (this.atCeiling) return
    if (this.isGrounded) this.airspeed = Math.max(this.airspeed, airspeed.start)
    super.moveUp(dt)
    if (this.angle === 0 || this.angle >= 2 * Math.PI - maxTilt)
      this.angle -= tiltRate * frames(dt)
  }

  moveDown(dt) {
    if (this.isGrounded) return
    super.moveDown(dt)
    if (this.angle <= maxTilt)
      this.angle += tiltRate * frames(dt)
  }

  shoot() {
    if (this.session.state !== 'running') return
    this.weapon.tryFire({ x: this.x + 5, y: this.y + 15 }, this.angle + Math.PI / 16)
  }

  shootAimed() {
    if (this.session.state !== 'running') return
    const target = nearestTarget(this.position, this.targets)
    if (target) this.weapon.tryFire(this.position, this.angleTo(target))
  }

  /** OSTALO ***/

  levelOut(dt) {
    if (this.dead || this.input.up || this.input.down || this.angle === 0) return
    const step = tiltRate * frames(dt)
    const toLevel = this.angle < Math.PI ? this.angle : 2 * Math.PI - this.angle
    // steps vary with the frame length, so snap to level instead of overshooting it
    if (toLevel <= step) this.angle = 0
    else this.angle += this.angle < Math.PI ? -step : step
  }

  /** On the ground the plane rolls out, as it did when the old scenery slowed down. */
  brake(dt) {
    if (!this.isGrounded) return
    this.airspeed *= .9 ** frames(dt)
  }

  explode() {
    const burst = this.bursts.find(free => !free.visible) ?? this.bursts[0]
    burst.start(this.x, this.y)
    this.explosionSound.play()
  }

  /** A hit or a crash blows the plane up in the air; it burns and falls with its speed. */
  die() {
    if (this.dead) return
    super.die()
    this.explode()
  }

  /** The falling wreck hits the ground nose first, blows up again and stops. */
  wreck() {
    this.wrecked = true
    this.airspeed = this.screenDx = 0
    this.explode()
  }

  /** The edges of the screen, the ground and the ceiling stop the plane; touching the ground too steeply wrecks it. */
  checkBounds() {
    const margin = this.width / 4
    const left = this.camera.cameraX + margin
    const right = this.camera.cameraX + canvas2d.width - margin
    if (this.x < left || this.x > right) {
      this.x = Math.min(right, Math.max(left, this.x))
      this.screenDx = 0
    }
    if (this.isGrounded) {
      this.y = this.groundY - this.height / 2
      if (this.dy > 0) this.dy = 0
      if (this.alive && this.angle > maxTilt / 2) this.die()
      if (this.dead && !this.wrecked) this.wreck()
    }
    if (this.atCeiling && this.dy < 0) {
      this.y = this.groundY - ceiling + this.height / 2
      this.dy = 0
    }
  }

  applyGravity(dt) {
    if (this.isGrounded) return
    this.addForce((this.dead ? wreckGravity : gravity) * frames(dt), Math.PI * .5)
  }

  checkCollisions() {
    if (this.dead) return
    this.solidBodies.forEach(body => {
      if (!this.collidesWith(body)) return
      this.die()
      body.die()
    })
  }

  update(dt, t) {
    this.engineSound.setPlaying(!this.dead)
    this.brake(dt)
    this.dx = this.airspeed + this.screenDx
    super.update(dt, t)
    this.screenDx *= (1 - this.frictionFactor) ** frames(dt, this.tunedFps)
    this.checkCollisions()
    if (this.session.state === 'running') this.bullets.checkHits(this.targets)
    this.applyGravity(dt)
    this.levelOut(dt)
    if (this.dead && !this.wrecked) this.angle += tumbleRate * dt
  }
}
