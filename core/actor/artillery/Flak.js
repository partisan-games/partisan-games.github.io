import Sound from '/core/io/audio/SoundSource.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import GroundTarget from '/core/actor/GroundTarget.js'
import FlakShell from '/core/actor/projectiles/FlakShell.js'
import Explosion from '/core/actor/effects/Explosion.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import WorldPart from '/core/actor/WorldPart.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { turn } from '/core/actor/worldView.js'
import GunCrew from './GunCrew.js'

/**
 * Light anti-aircraft fire: how far the gun reaches, in pixels, the seconds between shots, the shell speed, how close
 * to a burst the plane is hit, and how much of the plane's health one hit takes (five hits bring it down). A shell
 * bursts before the next shot, so one shell per gun is enough.
 */
export const flak = { range: 1000, reload: 3, shellSpeed: 600, burstRadius: 70, damage: 20 }
/**
 * The gun is drawn as a base and a barrel that turns about its breech. Measured on the 204 × 122 px picture: the
 * breech, the barrel's length and the angle it was drawn at. The barrel turns at `rate` radians a second, no lower
 * than `lowest` above the horizon, and fires only when it points within `onTarget` of where it aims.
 */
const picture = { width: 204, height: 122, breech: { x: 104, y: 44 }, barrelLength: 57, drawnAngle: Math.atan2(1 - 44, 66 - 104) }
const barrel = { rate: 1.5, lowest: .15, onTarget: .1 }
const scale = .75

/**
 * A crew at ease leaves the gun alone; set to fire, it trains the barrel where it aims and fires once on target; a
 * destroyed gun burns. Who sets it to fire, and where it aims, is up to the world.
 */
const states = {
  idle: {},
  fire: {
    update: (gun, dt) => {
      gun.trainBarrel(dt)
      gun.fire()
    },
  },
  dead: {
    enter: gun => {
      if (gun.alive) gun.die()
    },
  },
}

/** A light anti-aircraft gun. Its shell bursts where it aims and hurts `targets` close by. */
export default class Flak extends GroundTarget {
  constructor({ targets = [], session, ...options }) {
    super({ src: 'armies/game-ready/artiljerija/flak38-postolje.png', health: 30, vehicle: true, scale, ...options })
    this.targets = targets
    this.crew = new GunCrew('flak38')
    this.session = session
    /** Where the shell is to burst, once the gun has aimed. */
    this.aimPoint = null
    this.cooldown = new Cooldown({ seconds: flak.reload, clock: session.clock })
    // guns that come into view together do not fire together
    this.cooldown.start(Math.random() * flak.reload)
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .5, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shell = new FlakShell({ onBurst: shell => this.burst(shell) })
    this.burstSprite = new Explosion(this.camera, { scale: .75, smoke: true })
    this.barrel = new WorldPart('armies/game-ready/artiljerija/flak38-cev.png', { camera: this.camera, scale })
    this.muzzleFlash = new MuzzleFlash(this.camera)
    /** Where the barrel points, in radians: straight up is -π/2. */
    this.elevation = picture.drawnAngle
    this.children.push(this.barrel, this.shell, this.burstSprite, this.muzzleFlash)
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

  die() {
    if (this.dead) return
    super.die()
    this.barrel.hide()
    this.muzzleFlash.hide()
    this.crew.update(0, true)
    this.machine.set('dead')
  }

  onload() {
    super.onload()
    this.placeBarrel()
  }

  get breech() {
    return {
      x: this.x + (picture.breech.x - picture.width / 2) * scale,
      y: this.y + (picture.breech.y - picture.height / 2) * scale,
    }
  }

  get muzzle() {
    const { x, y } = this.breech
    const length = picture.barrelLength * scale
    return { x: x + Math.cos(this.elevation) * length, y: y + Math.sin(this.elevation) * length }
  }

  get reach() {
    return flak.range
  }

  /** The barrel is drawn leaning left, but it turns to either side. */
  get forward() {
    return -1
  }

  /** The barrel low over the horizon, and steep. */
  get shots() {
    return { straight: { x: 800, y: -200 }, up: { x: 300, y: -600 } }
  }

  /** Aims at `point` if it is above the gun and in reach, and gives whether it is. */
  aimAt(point) {
    const { breech } = this
    if (point.y >= breech.y || Math.hypot(point.x - breech.x, point.y - breech.y) > flak.range) return false
    this.aimPoint = { x: point.x, y: point.y }
    return true
  }

  /** The angle from the breech to where the gun aims. */
  get aimAngle() {
    const { breech, aimPoint } = this
    return Math.atan2(aimPoint.y - breech.y, aimPoint.x - breech.x)
  }

  /** Turns the barrel towards where the gun aims, as fast as it can, never below the horizon. */
  trainBarrel(dt) {
    if (this.dead || !this.aimPoint) return
    const wanted = Math.max(-Math.PI + barrel.lowest, Math.min(-barrel.lowest, this.aimAngle))
    const step = Math.max(-barrel.rate * dt, Math.min(barrel.rate * dt, turn(this.elevation, wanted)))
    this.elevation += step
  }

  /** The barrel turns about the breech, which is the middle of its picture. */
  placeBarrel() {
    const { x, y } = this.breech
    this.barrel.setPosition(x, y)
    this.barrel.angle = this.elevation - picture.drawnAngle
    const { muzzle } = this
    this.muzzleFlash.setPosition(muzzle.x, muzzle.y)
    this.muzzleFlash.angle = this.elevation
  }

  fire() {
    if (this.dead || this.session.state !== 'running' || !this.cooldown.ready || !this.aimPoint) return
    if (Math.abs(turn(this.elevation, this.aimAngle)) > barrel.onTarget) return
    const { breech, aimPoint } = this
    const fuse = Math.hypot(aimPoint.x - breech.x, aimPoint.y - breech.y) / flak.shellSpeed
    this.shell.fire(this.muzzle, this.elevation, flak.shellSpeed, fuse)
    this.muzzleFlash.start(this.muzzle, this.elevation)
    this.shotSound.play()
    this.cooldown.start()
    this.crew.fire()
  }

  burst({ x, y }) {
    this.burstSprite.start(x, y)
    if (this.session.state !== 'running') return
    for (const target of this.targets)
      if (Math.hypot(target.x - x, target.y - y) <= flak.burstRadius) target.takeHit(flak.damage)
  }

  update(dt, t) {
    super.update(dt, t)
    this.crew.update(dt, this.dead)
    if (this.alive) this.machine.update(dt)
    this.placeBarrel()
  }
}
