import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Shell from '/core/actor/projectiles/Shell.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import Health from '/core/gameplay/Health.js'
import VehicleSprite from '/core/actor/VehicleSprite.js'
import Renderer2D from '/core/Renderer2D.js'
import Weapon from '/core/gameplay/Weapon.js'
import Sound from '/core/io/audio/SoundSource.js'
import { frames } from '/core/constants.js'
import { shellGravity as gravity, shellSpeed as potisakMetka } from './shellPhysics.js'

/** Friction is the share of speed lost per frame at the tuned rate; `reverse` is the share of thrust driving back. */
export const tank = {
  thrust: 25, reverse: .6, reloadTime: 1, staticFriction: .3, kineticFriction: .1,
  burnBelow: 20, // energy at which a tank catches fire
}
/** How many pixels away a target must be for the barrel to rise one radian, and how high the barrel rises at most. */
const aimReach = gravity * gravity * 0.8
const highestBarrel = Math.PI * .2

/**
 * The tank stands, or drives ahead, or fires where its barrel points as often as it reloads, or burns destroyed. Each
 * lasts until it is set to another; who does it, and when, is up to the world. A tank that its `controller` drives
 * stays standing meanwhile.
 */
const states = {
  idle: {},
  drive: {
    update: (tank, dt) => tank.vozi(tank.thrust, tank.angle, dt),
  },
  fire: {
    update: tank => tank.shoot(),
  },
  dead: {
    enter: tank => tank.health.damage(tank.health.current),
  },
}

/**
 * Abstract class. `clock` is the game clock: reloading waits in a pause. The world may give it a `controller`, the
 * player's keys or an AI: it takes the tank's input and its step, at the moments the tank's own code once read them.
 */
export default class Tenk extends GameObject2D {
  constructor(src, {
    clock,
    groundY,
    cevSlika,
    art,
    width,
    height,
    tenkDesno = false,
    scale = window.innerWidth > 1280 ? 0.5 : 0.4,
    ...rest
  } = {}) {
    const bodyWidth = art ? width ?? (height ? height * art.frame.width / art.frame.height : art.frame.width * scale) : width
    const bodyHeight = art ? height ?? (width ? width * art.frame.height / art.frame.width : art.frame.height * scale) : height
    super(src, { flammable: true, scale, width: bodyWidth, height: bodyHeight, z: -1, ...rest })
    this.bodySprite = art ? new VehicleSprite(art) : null
    this.health = new Health({ maximum: 100 })
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .8, profile: 'cannon', spatial: { getPosition: () => this.audioShotPoint ?? this.position } })
    this.loadSound = new Sound('cannon-load.mp3', { volume: .4, profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.engineSound = new Sound('engine-diesel.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.loadSound, this.engineSound)
    this.tenkDesno = tenkDesno
    this.cev = new GameObject2D(cevSlika, { scale })
    this.cev.onload = () => this.azurirajCev()
    this.thrust = tank.thrust
    this.targets = []
    this.controller = null
    this.granate = new ProjectilePool({ owner: this, create: () => new Shell({ gravity, clock, groundLevel: groundY }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: tank.reloadTime, clock }),
      spawnProjectile: (position, angle) => this.granate.fire(position, angle, potisakMetka),
    })
    this.children.push(this.cev)
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

  onload() {
    this.azurirajCev()
  }

  get vrhCevi() {
    const x = Math.cos(this.cev.angle) * this.cev.diagonal + this.cev.x
    const y = Math.sin(this.cev.angle) * this.cev.diagonal + this.cev.y
    return { x, y }
  }

  /* ZDRAVLJE: the old names, read from the one health */

  get energija() {
    return this.health.current
  }

  get alive() {
    return this.health.alive
  }

  /** Coming back to life restores full energy, as it always has. */
  set alive(value) {
    if (!this.health) return // Predmet sets it before the tank has its health, which starts full anyway
    if (value) this.health.reset()
    else this.health.damage(this.health.current)
  }

  get burning() {
    return this.flammable && this.health.current <= tank.burnBelow
  }

  get ugaoUnazad() {
    return this.angle + Math.PI
  }

  /** Fires where the barrel points. */
  shoot() {
    this.fire(this.vrhCevi, this.cev.angle)
  }

  /** The recoil comes only with a shot that the reload allowed. */
  fire(poz, angle) {
    this.audioShotPoint = { x: poz.x, y: poz.y }
    if (this.weapon.tryFire(poz, angle)) {
      this.trzaj()
      this.shotSound.play()
      this.loadSound.play()
    }
  }

  /** A push while a key is held, as one a frame at the frame rate the game was tuned at, on any screen. */
  vozi(snaga, angle, dt) {
    this.addForce(snaga * frames(dt, this.tunedFps), angle)
  }

  /** Drives right (1) or left (-1): full thrust ahead, less in reverse. */
  drive(way, dt) {
    this.vozi(this.thrust * (way === this.forward ? 1 : tank.reverse), way > 0 ? 0 : Math.PI, dt)
  }

  /** Keeps the tank within its stretch of ground, `minX` to `maxX`. */
  checkBounds() {
    this.x = Math.min(Math.max(this.x, this.minX), this.maxX)
  }

  trzaj() {
    this.addForce(this.thrust, this.ugaoUnazad)
  }

  takeHit(damage) {
    this.trzaj()
    this.health.damage(damage)
    if (this.dead) this.setState('dead')
  }

  /**
   * The shots of the turning barrel, and how far ahead a target must be for each: the barrel level for a near one,
   * raised high for a far one.
   */
  get shots() {
    return { straight: { x: 300, y: 0 }, up: { x: highestBarrel * aimReach, y: 0 } }
  }

  /** As far as the barrel raised highest carries. */
  get reach() {
    return highestBarrel * aimReach
  }

  /** Raises the barrel for `point`, if it is ahead: the turret does not turn round. */
  aimAt(point) {
    if (Math.sign(point.x - this.x) !== this.forward) return false
    this.nisani(point)
    return true
  }

  /** The way the tank faces: 1 right, -1 left. */
  get forward() {
    return Math.sign(Math.cos(this.angle))
  }

  /** Raises the barrel the more, the farther `predmet` is, on whichever side the tank faces, up to its highest. */
  nisani(predmet) {
    const lift = Math.min(highestBarrel, Math.hypot(predmet.x - this.x, predmet.y - this.y) / aimReach)
    this.cev.angle = Math.cos(this.angle) < 0 ? Math.PI + lift : 2 * Math.PI - lift
  }

  handleInput(dt) {
    this.controller?.handleInput?.(dt)
  }

  render() {
    if (this.bodySprite && !this.debug) this.bodySprite.render(this)
    else Renderer2D.instance.drawObject(this)
  }

  update(dt) {
    const previousX = this.x
    this.engineSound.setPlaying(!this.dead)
    super.update(dt)
    if (this.alive) this.machine.update(dt)
    this.controller?.update?.(dt)
    this.azurirajCev()
    this.applyFriction(this.speed > 0.1 ? tank.kineticFriction : tank.staticFriction, dt)
    const movement = this.x - previousX
    // The loop's first tick after resuming has dt=0: keep the held drive phase.
    if (dt > 0 || !this.alive)
      this.bodySprite?.update(dt, Math.abs(movement) > .001, Math.sign(movement) * this.forward, this.alive)
    this.granate.checkHits(this.targets)
  }
}
